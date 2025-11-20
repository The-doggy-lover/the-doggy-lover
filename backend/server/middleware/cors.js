const cors = require('cors');

module.exports = cors({
  origin: process.env.VITE_FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
});
