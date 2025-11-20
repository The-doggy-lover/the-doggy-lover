// server/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // must match Google Console redirect URI
);

// convenience to get tokens from session
function getUserTokens(req) {
  return req.session?.googleTokens;
}

// POST /api/auth/google-login
// Frontend does Google client-side sign-in and sends email+fullname to this endpoint
router.post('/google-login', async (req, res) => {
  const { email, fullname } = req.body;

  if (!email || !fullname) {
    return res.status(400).json({ success: false, message: 'Missing email or fullname' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, fullname, email, user_type, phone_number FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      const user = rows[0];
      req.session.user = user;
      return res.json({
        success: true,
        isNew: false,
        user
      });
    }

    // If no user exists
    return res.json({
      success: true,
      isNew: true,
      user: {
        email,
        fullname,
        user_type: null
      }
    });

  } catch (err) {
    console.error("DB error in google-login:", err);
    res.status(500).json({ success: false, message: "DB error" });
  }
});

// GET /api/auth/google
// start server-side OAuth flow (redirect user to Google)
router.get('/google', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'openid',
      'email',
      'profile'
    ]
  });
  res.redirect(authUrl);
});

// GET /api/auth/oauth2callback
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    req.session.googleTokens = tokens;

    // Verify id token and extract email
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    // find or create user
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [result] = await db.query(
        'INSERT INTO users (fullname, email, google_refresh_token) VALUES (?, ?, ?)',
        [name, email, tokens.refresh_token || null]
      );
      userId = result.insertId;
    }

    req.session.userId = userId;
    req.session.user = { id: userId, email, fullname: name };

    // store refresh token if present
    if (tokens.refresh_token) {
      await db.query('UPDATE users SET google_refresh_token = ? WHERE id = ?', [tokens.refresh_token, userId]);
    }

    // redirect back to frontend
    const frontend = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:8080';
    res.redirect(frontend);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { fullname, phone_number, email, user_type, location, location_coords } = req.body;

  if (!fullname || !email || !user_type || !location || !location_coords) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check existing email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

    const [result] = await db.query(
      `INSERT INTO users 
        (fullname, phone_number, email, password, user_type, location, location_coords)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullname, phone_number, email, hashed, user_type, location, location_coords]
    );

    req.session.user = { id: result.insertId, fullname, email, user_type };

    res.json({ message: 'User created', user: req.session.user });

  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ message: 'Signup failed', error: e.code });
  }
});

// GET /api/auth/check-auth
router.get('/check-auth', (req, res) => {
  if (req.session?.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  res.status(401).json({ message: 'Not logged in' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.session.user.id, user_type: req.session.user.user_type });
});

// GET /user/:id
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  const { fullname, phone_number, user_type } = req.body;

  try {
    await db.query(
      `UPDATE users 
       SET fullname = ?, phone_number = ?, user_type = ?
       WHERE id = ?`,
      [fullname, phone_number, user_type, userId]
    );

    // Update session user
    if (req.session.user) {
      req.session.user.fullname = fullname;
      req.session.user.phone_number = phone_number;
      req.session.user.user_type = user_type;
    }

    res.json({
      message: "Profile updated successfully",
      user: req.session.user
    });

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


router.get('/users/email/:email', async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({ email: 'User ID is required' });
    }

    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) return res.json({ user: rows[0] });
      res.status(404).json({ error: 'User not found' });
    } catch (err) {
      console.error('DB error in /users/email:', err);
      res.status(500).json({ error: 'Database error' });
    }
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
})


module.exports = router;
