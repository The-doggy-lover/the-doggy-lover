const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const db = require('../lib/db');

// 1. DYNAMIC CONFIGURATION
// We do not define paths or call fs at the top level to prevent boot-time crashes.
let upload;

if (process.env.VERCEL === '1' || !!process.env.VERCEL) {
  // ✅ VERCEL PATH: Pure memory, no 'fs', no 'path', no 'mkdir'
  console.log('Detected Vercel environment: Using Memory Storage');
  upload = multer({ storage: multer.memoryStorage() });
} else {
  // ✅ LOCAL PATH: Only load fs/path and create dirs if NOT on Vercel
  const fs = require('fs');
  const path = require('path');
  
  // Use process.cwd() to stay within the project root
  const uploadDir = path.join(process.cwd(), 'uploads', 'pet-pics');
  
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Local mkdir failed:', err);
    }
  }

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
  });
}

// Helper reverse geocode (used for human-friendly location)
async function reverseGeocode(latlngString) {
  if (!latlngString) return null;
  const [lat, lon] = latlngString.split(',').map(Number);
  if (!lat || !lon) return latlngString;
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json' },
      headers: { 'User-Agent': 'petmypet-app/1.0' }
    });
    return response.data.display_name || latlngString;
  } catch (err) {
    console.error('Reverse geocoding failed:', err.message);
    return latlngString;
  }
}


router.get('/browse', (req, res) => {
  db.query(
    `SELECT id, pet_name, breed, age, gender, description, pet_photo, isOnline, location, location_coords, vaccinated, birthday, available_start_time, available_end_time
     FROM pets
     WHERE isOnline = 1`,
    (err, rows) => {
      if (err) {
        console.error('DB error on GET /pets/browse:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// GET /api/pets/recent
router.get('/recent', (req, res) => {
  const sql = `
    SELECT * FROM pets
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY RAND()
    LIMIT 5
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// GET /api/pets (all)
router.get('/pets', async(req, res) => {
  try {
    const [pets] = await db.query('SELECT * FROM pets');

    res.json(pets);
  } catch (err) {
    console.error('Get pets error:', err);
    res.status(500).json({ message: 'Could not load pets' });
  }
});

// POST /api/pets/generate-description
router.post('/generate-description', async (req, res) => {
  try {
    let { pet_name, selectedBreed, newBreed, age, gender } = req.body;
    const breed = selectedBreed === 'custom' ? (newBreed || '').trim() : (selectedBreed || '').trim();
    if (!pet_name || !breed || !age || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Write one short sentence for introducing a ${gender} ${breed} named ${pet_name}, age ${age}.`;

    // Call OpenAI REST API (keep model choice as you prefer)
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      })
    });
    const openaiData = await openaiRes.json();
    const generatedText = openaiData?.choices?.[0]?.message?.content?.trim() || '';

    res.json({ description: generatedText });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

// POST /api/pets/add-pet
router.post('/add-pet', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let { pet_name, breed, custom_breed, age, gender, description, isOnline } = req.body;
    breed = (custom_breed?.trim() || breed || '').trim();

    if (!pet_name || !breed || !age || !gender) {
      return res.status(400).json({ error: 'Missing required pet data' });
    }

    // 🧠 Handle photo differently for Vercel vs local
    let petPhoto = null;

    if (isVercel) {
      // Vercel: multer.memoryStorage → file exists in memory
      if (!req.file) {
        return res.status(400).json({ error: 'Photo is required' });
      }

      // 🚨 For now we do NOT store the image on Vercel FS
      // Later you can upload req.file.buffer to Cloudinary/S3
      petPhoto = null;
    } else {
      // Local: disk storage
      if (!req.file || !req.file.filename) {
        return res.status(400).json({ error: 'Photo is required' });
      }
      petPhoto = req.file.filename;
    }

    const [[userRow]] = await db.query(
      'SELECT location_coords FROM users WHERE id = ?',
      [userId]
    );

    const rawCoords = userRow?.location_coords || null;
    const humanLocation = rawCoords
      ? await reverseGeocode(rawCoords)
      : '';

    // Save breed if custom
    await db.query('INSERT IGNORE INTO breeds (name) VALUES (?)', [breed]);

    await db.execute(
      `INSERT INTO pets
        (user_id, pet_name, breed, age, gender, description, pet_photo, isOnline, location, location_coords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        pet_name,
        breed,
        age,
        gender,
        description || '',
        petPhoto,
        isOnline ? 1 : 0,
        humanLocation,
        rawCoords
      ]
    );

    res.status(201).json({ message: 'Pet added successfully' });

  } catch (err) {
    console.error('Error in POST /add-pet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Favourites endpoints (user favourites)
router.get('/users/:id/favourites', async (req, res) => {
  const userId = req.params.id;
  try {
    const [pets] = await db.query(
      `SELECT p.* FROM favourites f JOIN pets p ON f.pet_id = p.id WHERE f.user_id = ?`,
      [userId]
    );
    res.json(pets);
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

router.patch('/users/:id/favourites', async (req, res) => {
  const userId = req.params.id;
  const { petId } = req.body;
  try {
    const [[existing]] = await db.query('SELECT 1 FROM favourites WHERE user_id = ? AND pet_id = ?', [userId, petId]);
    if (existing) {
      await db.query('DELETE FROM favourites WHERE user_id = ? AND pet_id = ?', [userId, petId]);
    } else {
      await db.query('INSERT INTO favourites (user_id, pet_id) VALUES (?, ?)', [userId, petId]);
    }
    const [rows] = await db.query('SELECT pet_id FROM favourites WHERE user_id = ?', [userId]);
    res.json({ favourites: rows.map(r => r.pet_id) });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Failed to update favourites' });
  }
});

// GET /api/pets/my-pets
router.get('/my-pets', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const [rows] = await db.query('SELECT * FROM pets WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching pets:', err); res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/pets/:id/visibility
router.patch('/:id/visibility', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const petId = req.params.id;
  const isOnline = req.body.isOnline ? 1 : 0;
  db.query(
    'UPDATE pets SET isOnline = ? WHERE id = ? AND user_id = ?',
    [isOnline, petId, userId],
    (err, result) => {
      if (err) {
        console.error('Toggle visibility error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pet not found or not yours' });
      res.json({ message: 'Visibility updated', isOnline });
    }
  );
});


// GET /api/pets/:id
router.get('/:id', async (req, res) => {
  const petId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pet not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('DB error fetching pet:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/pets/:id
router.patch('/:id', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const petId = req.params.id;
  let {
    pet_name, breed, age, gender, description, birthday, vaccinated,
    available_days, available_start_time, available_end_time
  } = req.body;
  if (Array.isArray(available_days)) available_days = available_days.join(',');

  try {
    const [result] = await db.execute(
      `UPDATE pets SET
         pet_name = ?, breed = ?, age = ?, gender = ?, description = ?, birthday = ?, vaccinated = ?, available_days = ?, available_start_time = ?, available_end_time = ?
       WHERE id = ? AND user_id = ?`,
      [
        pet_name, breed, age, gender, description || '', birthday || null,
        vaccinated ? 1 : 0, available_days, available_start_time, available_end_time,
        petId, userId
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Pet not found or not yours' });

    const [rows] = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    res.json({ message: 'Pet updated successfully', pet: rows[0] });
  } catch (err) {
    console.error('DB error updating pet:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
