// api/index.js
const serverless = require('serverless-http');
const app = require('../api/index.js'); // import Express app
module.exports = serverless(app);
