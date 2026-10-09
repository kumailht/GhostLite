const debug = require('@tryghost/debug')('web:admin:app');
const path = require('path');
const express = require('../../../shared/express');
const config = require('../../../shared/config');
const shared = require('../shared');
const errorHandler = require('@tryghost/mw-error-handler');
const sentry = require('../../../shared/sentry');
const redirectAdminUrls = require('./middleware/redirect-admin-urls');

const serveStatic = express.serveStatic;

/**
 *
 * @returns {import('express').Application}
 */
module.exports = function setupAdminApp() {
  debug('Admin setup start');
  const adminApp = express('admin');

  // Admin assets
  // @NOTE: when we start working on HTTP/3 optimizations the immutable headers
  //        produced below should be split into separate 'Cache-Control' entry.
  //        For reference see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#validation_2

  adminApp.use(
    '/assets',
    serveStatic(path.join(config.get('paths').adminAssets, 'assets'), {
      // @NOTE: the maxAge config passed below are in milliseconds and the config
      //        is specified in seconds. See https://github.com/expressjs/serve-static/issues/150 for more context
      maxAge: config.get('caching:admin:maxAge') * 1000,
      immutable: true,
      fallthrough: false,
    }),
  );

  // Force SSL if required
  // must happen AFTER asset loading and BEFORE routing
  adminApp.use(shared.middleware.urlRedirects.adminSSLAndHostRedirect);

  // Deep-link redirect (e.g. /ghost/members/import -> /ghost/#/members/import).
  // Must run BEFORE prettyUrls so the captured path doesn't pick up a trailing
  // slash that React Router's hash routes don't match.
  adminApp.use(redirectAdminUrls);

  // Add in all trailing slashes & remove uppercase
  // must happen AFTER asset loading and BEFORE routing
  adminApp.use(shared.middleware.prettyUrls);

  // Cache headers go last before serving the request
  // Admin is currently set to not be cached at all
  adminApp.use(shared.middleware.cacheControl('private'));

  // Finally, routing
  adminApp.get('*', require('./controller'));

  adminApp.use(function fourOhFourMw(err, req, res, next) {
    if (err.statusCode && err.statusCode === 404) {
      // Remove 404 errors for next middleware to inject
      next();
    } else {
      next(err);
    }
  });
  adminApp.use(errorHandler.pageNotFound);
  adminApp.use(errorHandler.handleHTMLResponse(sentry));

  debug('Admin setup end');

  return adminApp;
};
