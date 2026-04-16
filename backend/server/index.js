require('dotenv').config();

const session = require('express-session');
const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const petsRouter = require('./routes/pets');
const meetingsRouter = require('./routes/meetings');
const breedsRouter = require('./routes/breeds');

const app = express();

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

app.options(/.*/, cors());

app.set('trust proxy', 1);

app.use(session({
  name: 'pmp.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true, // 🔥 ADD THIS LINE
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

console.log("ENV:", process.env.NODE_ENV);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

//This is a comment by Amit

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;