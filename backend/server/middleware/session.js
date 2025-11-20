const cookieSession = require('cookie-session');

module.exports = cookieSession({
  name: 'pmp_session',
  keys: [process.env.SESSION_KEY || 'dev-secret'],
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
});
