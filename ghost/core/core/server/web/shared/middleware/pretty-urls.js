// Pretty URL redirects
//
// These are two pieces of middleware that handle ensuring that
// URLs get formatted correctly.
// Slashes ensures that we get trailing slashes
// Uncapitalise changes case to lowercase
// @TODO optimize this to reduce the number of redirects required to get to a pretty URL
// @TODO move this to being used by routers?
const path = require('path');
const slashes = require('connect-slashes');
const config = require('../../../../shared/config');

const SKIP_SLASH_EXTENSIONS = new Set(['.md', '.txt']);

const ensureTrailingSlash = slashes(true, {
  headers: {
    'Cache-Control': `public, max-age=${config.get('caching:301:maxAge')}`,
  },
});

function skipSlashesForLlmsExtensions(req, res, next) {
  const ext = path.extname(req.path || '');

  if (ext && SKIP_SLASH_EXTENSIONS.has(ext)) {
    return next();
  }

  return ensureTrailingSlash(req, res, next);
}

module.exports = [skipSlashesForLlmsExtensions, require('./uncapitalise')];
