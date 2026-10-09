/**
 * @file Middleware to set the appropriate cache headers on the frontend
 */
const config = require('../../../shared/config');
const shared = require('../../../server/web/shared');
const preview = require('../../services/theme-engine/preview');

/**
 * Returns the frontend caching middleware.
 * @returns {Promise<import('express').RequestHandler>} Middleware function.
 */
const getMiddleware = async () => {
  /**
   * Middleware to set cache headers based on site configuration and request properties.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  function setFrontendCacheHeadersMiddleware(req, res, next) {
    if (req.header?.(preview._PREVIEW_HEADER_NAME)) {
      return shared.middleware.cacheControl('noCache')(req, res, next);
    }

    // CASE: Never cache if the blog is set to private
    if (res.isPrivateBlog) {
      return shared.middleware.cacheControl('private')(req, res, next);
    }

    // CASE: Never cache preview routes
    if (req.path?.startsWith('/p/')) {
      return shared.middleware.cacheControl('noCache')(req, res, next);
    }

    return shared.middleware.cacheControl('public', {
      maxAge: config.get('caching:frontend:maxAge'),
    })(req, res, next);
  }

  return setFrontendCacheHeadersMiddleware;
};

module.exports = {
  getMiddleware,
};
