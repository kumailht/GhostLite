const session = require('./session');
const apiKeyAuth = require('./api-key');

const authenticate = {
  authenticateAdminApi: [apiKeyAuth.admin.authenticate, session.authenticate],
  authenticateAdminApiWithUrl: [apiKeyAuth.admin.authenticateWithUrl],

  authenticateContentApi: [apiKeyAuth.content.authenticateContentApiKey],
};

module.exports = authenticate;
