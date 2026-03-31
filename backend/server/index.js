require('dotenv').config();

const session = require('express-session');
const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const petsRouter = require('./routes/pets');
const meetingsRouter = require('./routes/meetings');
const breedsRouter = require('./routes/breeds');

const app = express();

app.use(session({
  name: 'pmp.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.VERCEL ? true : false,
    sameSite: process.env.VERCEL ? 'none' : 'lax'
  }
}));

app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://petmypet.app'
  ],
  credentials: true
}));

app.options(/.*/, cors());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

app.get(['/', '/health', '/api/health'], (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Server is running'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/pets', petsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/breeds', breedsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.url
  });
});


if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;