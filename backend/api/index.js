// api/index.js
const serverless = require('serverless-http');
const app = require('../server/index'); // import Express app
module.exports = serverless(app);
