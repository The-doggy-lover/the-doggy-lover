// server/routes/meetings.js
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://the-doggy-lover-backend.vercel.app/api/auth/google/callback"
);

// POST /api/meetings/book-appointment
router.post('/book-appointment', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });
  const { pet_id, date, time } = req.body;
  if (!pet_id || !date || !time) return res.status(400).json({ message: 'All fields required' });

  try{
    const [[pet]] = await db.query(
      `SELECT available_days, available_start_time, available_end_time 
       FROM pets WHERE id = ?`,
      [pet_id]
    );

    if (!pet) return res.status(404).json({ message: 'Pet not found' });

    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const currentDay = dow[new Date(date).getDay()];
    const allowedDays = (pet.available_days || '').split(',').filter(Boolean);

    if (allowedDays.length && !allowedDays.includes(currentDay)) {
      return res.status(400).json({
        message: `Pet not available on ${currentDay}`
      });
    }

    if (pet.available_start_time && pet.available_end_time) {
      if (time < pet.available_start_time || time > pet.available_end_time) {
        return res.status(400).json({
          message: `Please pick a time between ${pet.available_start_time} and ${pet.available_end_time}`
        });
      }
    }

    await db.query(
      'INSERT INTO meetings (user_id, pet_id, date, time) VALUES (?,?,?,?)',
      [userId, pet_id, date, time]
    );

    res.json({ message: 'Meeting successfully booked' });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/meetings/booked-slots?pet_id=..&date=..
router.get('/booked-slots', async (req, res) => {
  const { pet_id, date } = req.query;
  if (!pet_id || !date) return res.status(400).json({ error: 'Missing fields' });

  try {
    const [rows] = await db.query(
      'SELECT time FROM meetings WHERE pet_id = ? AND date = ?',
      [pet_id, date]
    );
    res.json(rows.map(r => r.time));
  } catch (err) {
    console.error('Error fetching booked slots:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/meetings/requests (for pet owner)
router.get('/requests', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const [results] = await db.query(
      `SELECT m.id, p.pet_name, m.date, m.time, m.confirmation
       FROM meetings m
       JOIN pets p ON m.pet_id = p.id
       WHERE p.user_id = ?`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error('DB error fetching meetings:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/meetings (confirmed for owner)
router.get('/', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const [results] = await db.query(
      `SELECT m.id, m.pet_id, p.pet_name, m.date, m.time
       FROM meetings m 
       JOIN pets p ON m.pet_id = p.id
       WHERE p.user_id = ? AND m.confirmation = 1
       ORDER BY m.date, m.time`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    console.error('DB error fetching meetings:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/meetings/user (bookings made by logged-in user)
router.get('/user', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const [results] = await db.query(
      `SELECT m.id, m.pet_id, p.pet_name, m.date, m.time, m.confirmation
       FROM meetings m
       JOIN pets p ON m.pet_id = p.id
       WHERE m.user_id = ?
       ORDER BY m.date, m.time`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error('DB error fetching user meetings:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// PATCH /api/meetings/:id/confirmation
router.patch('/:id/confirmation', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const meetingId = req.params.id;
  const { confirmation } = req.body;

  try {
    const [rows] = await db.query(
      `SELECT m.id
       FROM meetings m
       JOIN pets p ON m.pet_id = p.id
       WHERE m.id = ? AND p.user_id = ?`,
      [meetingId, userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    await db.query(
      'UPDATE meetings SET confirmation = ? WHERE id = ?',
      [confirmation ? 1 : 0, meetingId]
    );

    res.json({ message: 'Confirmation updated' });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});


// GET /sync-calendar
router.get('/sync-calendar', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    console.log("SESSION:", req.session);
    console.log("USER IN SESSION:", req.session.user);
    console.log("USER ID:", req.session.user?.id);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const [rows] = await db.query('SELECT * FROM meetings WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/sync-calendar', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const { calendarEvents } = req.body;

    console.log("🟢 User ID:", userId);
    console.log("📦 Incoming events:", calendarEvents);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!calendarEvents || !Array.isArray(calendarEvents)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // ✅ Get tokens from session
    const tokens = req.session.googleTokens;
    if (!tokens) {
      return res.status(400).json({ error: 'No Google tokens' });
    }

    const { google } = require('googleapis');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // ✅ Attach tokens
    oauth2Client.setCredentials(tokens);

    // ✅ Create calendar instance
    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client
    });

    for (const event of calendarEvents) {
      if (!event.pet_id || !event.date || !event.time) continue;

      const cleanDate = event.date.slice(0, 10);

      // ✅ Save to DB
      await db.query(
        `INSERT INTO meetings (user_id, pet_id, date, time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE date=?, time=?`,
        [userId, event.pet_id, cleanDate, event.time, cleanDate, event.time]
      );

      // 🔥 FIXED TIME FORMAT
      const formattedTime = event.time.split(':').slice(0, 2).join(':') + ':00';

      // optional: make it 30 min long
      const endTime = new Date(`${cleanDate}T${formattedTime}`);
      endTime.setMinutes(endTime.getMinutes() + 30);

      // ✅ Add to Google Calendar
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Meeting with pet ${event.pet_id}`,
          start: {
            dateTime: `${cleanDate}T${formattedTime}`,
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
        },
      });

      console.log("📅 Added to Google Calendar:", event);
    }

    console.log("✅ Sync completed");
    res.json({ message: 'Calendar synced successfully' });

  } catch (err) {
    console.error('💥 Error syncing calendar:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

      

module.exports = router;
