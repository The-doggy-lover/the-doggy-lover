// server/index.js (top portion)
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const serverless = require('serverless-http');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const petsRouter = require('./routes/pets');
const meetingsRouter = require('./routes/meetings');
const breedsRouter = require('./routes/breeds');

const app = express();

/**
 * Allowed origins: only your front-end domains.
 * Use exact origins (don't use "*") because you need cookies/credentials.
 */
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'https://petmypet.in',
  'https://www.petmypet.in'
];
const allowedOrigin = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://www.petmypet.in';

/* Logging (helpful for Vercel) */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} Origin:${req.headers.origin}`);
  next();
});

/* Dynamic CORS middleware that only allows configured origins and responds to OPTIONS */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin === allowedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    // Allow Google popup communication if necessary:
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  } else {
    // no Access-Control-Allow-Origin header set if not allowed
  }

  // handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

/* Body parsing */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Session cookie — note secure/sameSite settings for cross-domain cookies */
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // If front+backend are on different domains and you want cookies shared,
    // you must set sameSite: 'none' and secure: true (HTTPS).
    sameSite: (process.env.COOKIE_SAMESITE || 'lax'),
    maxAge: 1000 * 60 * 60 * 24
  }
}));

/* Static images */
app.use('/pet-pics', express.static(path.join(__dirname, '..', 'uploads', 'pet-pics')));

/* Mount routers */
app.use('/api/auth', authRouter);
app.use('/api/pets', petsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/breeds', breedsRouter);

/* sanity */
app.get('/api/health', (req, res) => res.json({ ok: true }));

/* start locally */
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

/* export serverless handler for Vercel */
module.exports = app;
