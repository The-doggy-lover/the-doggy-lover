// server/routes/breeds.js
const express = require('express');
const router = express.Router();
const db = require('../lib/db');

router.post('/breeds', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing breed name' });
  try {
    const [result] = await db.query('INSERT INTO breeds (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Breed already exists' });
    console.error('DB error in POST /breeds:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/breeds', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM breeds');
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch breeds:', err);
    res.status(500).json({ error: 'Failed to fetch breeds' });
  }
});

module.exports = router;
