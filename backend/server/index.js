// VERY TOP of server/index.js (copy/paste)
console.log('@@@ BOOT START - server/index.js');
process.on('uncaughtException', (err) => {
  console.error('@@@ UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('@@@ UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});


// server/index.js (top portion)
require('dotenv').config();

const express = require('express');

const path = require('path');

//const authRouter = require('./routes/auth');
//const petsRouter = require('./routes/pets');
//const meetingsRouter = require('./routes/meetings');
//const breedsRouter = require('./routes/breeds');

let authRouter, petsRouter, meetingsRouter, breedsRouter;
try {
  // attempt to require but if it throws, log it and replace with a no-op router
  authRouter = require('./routes/auth');
} catch (e) {
  console.error('@@@ require ./routes/auth FAILED:', e && e.stack ? e.stack : e);
  const express = require('express'); authRouter = express.Router(); // noop router
}
try {
  petsRouter = require('./routes/pets');
} catch (e) {
  console.error('@@@ require ./routes/pets FAILED:', e && e.stack ? e.stack : e);
  const express = require('express'); petsRouter = express.Router();
}
try {
  meetingsRouter = require('./routes/meetings');
} catch (e) {
  console.error('@@@ require ./routes/meetings FAILED:', e && e.stack ? e.stack : e);
  const express = require('express'); meetingsRouter = express.Router();
}
try {
  breedsRouter = require('./routes/breeds');
} catch (e) {
  console.error('@@@ require ./routes/breeds FAILED:', e && e.stack ? e.stack : e);
  const express = require('express'); breedsRouter = express.Router();
}

const app = express();

const session = require('express-session');

const sessionMiddleware = session({
  name: 'pmp.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !!process.env.VERCEL, // only true when Vercel sets env
    sameSite: 'none'
  }
});

// use session only after health route
// app.use(sessionMiddleware);   <-- comment this out for now


app.use((req, res, next) => {
  // Allow your frontend to talk to popups safely
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

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


// put this above your other routes in server/index.js
app.get(['/', '/health', '/api/health'], (req, res) => {
  console.log('Health check hit (url=', req.url, 'Origin=', req.headers.origin, ')');
  return res.status(200).json({ status: 'ok', message: 'Server is running' });
});


const fs = require('fs');

if (process.env.VERCEL !== '1') {
  // 🖥️ Local dev ONLY
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'pet-pics');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/pet-pics', express.static(uploadsDir));
  console.log('@@@ Local mode: serving pet-pics from', uploadsDir);
} else {
  // ☁️ Vercel: do NOTHING
  console.log('@@@ Vercel mode: pet-pics disabled (use cloud storage)');
}


/* Mount routers */
app.use('/api/auth', authRouter);
app.use('/api/pets', petsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/breeds', breedsRouter);

/* export serverless handler for Vercel */
module.exports = app;
