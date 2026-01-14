// const serverless = require('serverless-http');
// const app = require('../server/index');

// module.exports = serverless(app);

module.exports = (req, res) => {
    const app = require('../server/index');
    return app(req, res);
  };
  