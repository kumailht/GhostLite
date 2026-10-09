const express = require('../../../../../shared/express');
const api = require('../../../../api').endpoints;
const { http } = require('@tryghost/api-framework');
const auth = require('../../../../services/auth');
const apiMw = require('../../middleware');
const mw = require('./middleware');
const labs = require('../../../../../shared/labs');

const shared = require('../../../shared');

/**
 * @returns {import('express').Router}
 */
module.exports = function apiRoutes() {
  const router = express.Router('admin api');

  router.use(apiMw.cors);

  // ## Public
  router.get('/site', mw.publicAdminApi, http(api.site.read));

  // ## Configuration
  router.get('/config', mw.authAdminApi, http(api.config.read));
  router.get('/config/featurebase', mw.authAdminApi, http(api.config.featurebase));

  // ## Posts
  router.get('/posts', mw.authAdminApi, http(api.posts.browse));
  router.get('/posts/export', mw.authAdminApi, http(api.posts.exportCSV));

  router.post('/posts', mw.authAdminApi, http(api.posts.add));
  router.delete('/posts', mw.authAdminApi, http(api.posts.bulkDestroy));
  router.put('/posts/bulk', mw.authAdminApi, http(api.posts.bulkEdit));
  router.post(
    '/posts/upload',
    mw.authAdminApi,
    labs.enabledMiddleware('csvContentImporter'),
    apiMw.upload.single('postsfile'),
    apiMw.upload.validation({ type: 'posts' }),
    http(api.posts.importCSV),
  );
  router.get('/posts/:id', mw.authAdminApi, http(api.posts.read));
  router.get('/posts/slug/:slug', mw.authAdminApi, http(api.posts.read));
  router.put('/posts/:id', mw.authAdminApi, http(api.posts.edit));
  router.delete('/posts/:id', mw.authAdminApi, http(api.posts.destroy));
  router.post('/posts/:id/copy', mw.authAdminApi, http(api.posts.copy));

  // ## Pages
  router.get('/pages', mw.authAdminApi, http(api.pages.browse));
  router.delete('/pages', mw.authAdminApi, http(api.pages.bulkDestroy));
  router.put('/pages/bulk', mw.authAdminApi, http(api.pages.bulkEdit));
  router.post('/pages', mw.authAdminApi, http(api.pages.add));
  router.get('/pages/:id', mw.authAdminApi, http(api.pages.read));
  router.get('/pages/slug/:slug', mw.authAdminApi, http(api.pages.read));
  router.put('/pages/:id', mw.authAdminApi, http(api.pages.edit));
  router.delete('/pages/:id', mw.authAdminApi, http(api.pages.destroy));
  router.post('/pages/:id/copy', mw.authAdminApi, http(api.pages.copy));

  // # Integrations

  router.get('/integrations', mw.authAdminApi, http(api.integrations.browse));
  router.get('/integrations/:id', mw.authAdminApi, http(api.integrations.read));
  router.post('/integrations', mw.authAdminApi, http(api.integrations.add));
  router.post(
    '/integrations/:id/api_key/:keyid/refresh',
    mw.authAdminApi,
    http(api.integrations.edit),
  );
  router.put('/integrations/:id', mw.authAdminApi, http(api.integrations.edit));
  router.delete('/integrations/:id', mw.authAdminApi, http(api.integrations.destroy));

  // ## Schedules
  router.put('/schedules/:resource/:id', mw.authAdminApiWithUrl, http(api.schedules.publish));

  // ## Settings
  router.get('/settings/routes/yaml', mw.authAdminApi, http(api.settings.download));
  router.post(
    '/settings/routes/yaml',
    mw.authAdminApi,
    apiMw.upload.single('routes'),
    apiMw.upload.validation({ type: 'routes' }),
    http(api.settings.upload),
  );

  router.get('/settings', mw.authAdminApi, http(api.settings.browse));
  router.put('/settings', mw.authAdminApi, http(api.settings.edit));
  router.post(
    '/settings/access_code/regenerate',
    mw.authAdminApi,
    http(api.settings.regenerateAccessCode),
  );

  // ## Users
  router.get('/users', mw.authAdminApi, http(api.users.browse));
  router.get('/users/:id', mw.authAdminApi, http(api.users.read));
  router.get('/users/slug/:slug', mw.authAdminApi, http(api.users.read));
  // NOTE: We don't expose any email addresses via the public api.
  router.get('/users/email/:email', mw.authAdminApi, http(api.users.read));
  router.get('/users/:id/token', mw.authAdminApi, http(api.users.readStaffToken));

  router.put('/users/password', mw.authAdminApi, http(api.users.changePassword));
  router.put('/users/owner', mw.authAdminApi, http(api.users.transferOwnership));
  router.put('/users/:id', mw.authAdminApi, http(api.users.edit));
  router.put('/users/:id/token', mw.authAdminApi, http(api.users.regenerateStaffToken));
  router.delete('/users/:id', mw.authAdminApi, http(api.users.destroy));

  // ## Tags
  router.get('/tags', mw.authAdminApi, http(api.tags.browse));
  router.get('/tags/:id', mw.authAdminApi, http(api.tags.read));
  router.get('/tags/slug/:slug', mw.authAdminApi, http(api.tags.read));
  router.post('/tags', mw.authAdminApi, http(api.tags.add));
  router.put('/tags/:id', mw.authAdminApi, http(api.tags.edit));
  router.delete('/tags/:id', mw.authAdminApi, http(api.tags.destroy));

  // ## Roles
  router.get('/roles/', mw.authAdminApi, http(api.roles.browse));

  // ## Slugs
  router.get('/slugs/:type/:name', mw.authAdminApi, http(api.slugs.generate));
  router.get('/slugs/:type/:name/:id', mw.authAdminApi, http(api.slugs.generate));

  // ## Themes
  router.get('/themes/', mw.authAdminApi, http(api.themes.browse));

  router.get('/themes/:name/download', mw.authAdminApi, http(api.themes.download));

  router.get('/themes/active', mw.authAdminApi, http(api.themes.readActive));

  router.post(
    '/themes/upload',
    mw.authAdminApi,
    apiMw.upload.themeZip('file'),
    apiMw.upload.validation({ type: 'themes' }),
    http(api.themes.upload),
  );

  router.post('/themes/install', mw.authAdminApi, http(api.themes.install));

  router.put('/themes/:name/activate', mw.authAdminApi, http(api.themes.activate));

  router.delete('/themes/:name', mw.authAdminApi, http(api.themes.destroy));

  // ## Notifications
  router.get('/notifications', mw.authAdminApi, http(api.notifications.browse));
  router.post('/notifications', mw.authAdminApi, http(api.notifications.add));
  router.delete(
    '/notifications/:notification_id',
    mw.authAdminApi,
    http(api.notifications.destroy),
  );

  // ## DB
  router.get('/db', mw.authAdminApi, http(api.db.exportContent));
  router.post(
    '/db',
    mw.authAdminApi,
    apiMw.upload.single('importfile'),
    apiMw.upload.validation({ type: 'db' }),
    http(api.db.importContent),
  );
  router.delete('/db', mw.authAdminApi, http(api.db.deleteAllContent));
  router.post('/db/backup', mw.authAdminApi, http(api.db.backupContent));

  router.post('/db/media/inline', mw.authAdminApi, http(api.db.inlineMedia));

  // ## Exports
  router.get('/exports/download', mw.authAdminApi, http(api.exports.download));
  router.post('/exports', mw.authAdminApi, http(api.exports.add));

  // ## Featurebase
  router.get('/featurebase/token', mw.authAdminApi, http(api.featurebase.token));

  // ## Sessions
  // We don't need auth when creating a new session (logging in)
  router.post(
    '/session',
    shared.middleware.brute.globalBlock,
    shared.middleware.brute.userLogin,
    http(api.session.add),
  );
  router.delete('/session', mw.authAdminApi, http(api.session.delete));
  router.post(
    '/session/verify',
    shared.middleware.brute.sendVerificationCode,
    http(api.session.sendVerification),
  );
  router.put('/session/verify', shared.middleware.brute.userVerification, http(api.session.verify));

  // ## Authentication
  router.post(
    '/authentication/password_reset',
    shared.middleware.brute.globalReset,
    shared.middleware.brute.userReset,
    http(api.authentication.generateResetToken),
  );
  router.put(
    '/authentication/password_reset',
    shared.middleware.brute.globalBlock,
    auth.session.initSession,
    http(api.authentication.resetPassword),
  );
  router.post('/authentication/invitation', http(api.authentication.acceptInvitation));
  router.get('/authentication/invitation', http(api.authentication.isInvitation));
  router.post('/authentication/setup', http(api.authentication.setup));
  router.put('/authentication/setup', mw.authAdminApi, http(api.authentication.updateSetup));
  router.get('/authentication/setup', http(api.authentication.isSetup));
  router.post('/authentication/reset', mw.authAdminApi, http(api.authentication.reset));

  // ## Images
  router.post(
    '/images/upload',
    mw.authAdminApi,
    apiMw.upload.single('file'),
    apiMw.upload.validation({ type: 'images' }),
    http(api.images.upload),
  );

  // ## media
  router.post(
    '/media/upload',
    mw.authAdminApi,
    apiMw.upload.media('file', 'thumbnail'),
    apiMw.upload.mediaValidation({ type: 'media' }),
    http(api.media.upload),
  );
  router.put(
    '/media/thumbnail/upload',
    mw.authAdminApi,
    apiMw.upload.single('file'),
    apiMw.upload.validation({ type: 'images' }),
    http(api.media.uploadThumbnail),
  );

  // ## files
  router.post(
    '/files/upload',
    mw.authAdminApi,
    apiMw.upload.single('file'),
    apiMw.upload.fileValidation({ type: 'files' }),
    http(api.files.upload),
  );

  // ## Invites
  router.get('/invites', mw.authAdminApi, http(api.invites.browse));
  router.get('/invites/:id', mw.authAdminApi, http(api.invites.read));
  router.post('/invites', mw.authAdminApi, http(api.invites.add));
  router.delete('/invites/:id', mw.authAdminApi, http(api.invites.destroy));

  // ## Redirects
  router.get('/redirects/download', mw.authAdminApi, http(api.redirects.download));
  router.post(
    '/redirects/upload',
    mw.authAdminApi,
    apiMw.upload.single('redirects'),
    apiMw.upload.validation({ type: 'redirects' }),
    http(api.redirects.upload),
  );

  // ## Oembed (fetch response from oembed provider)
  router.get('/oembed', mw.authAdminApi, http(api.oembed.read));

  // ## Actions
  router.get('/actions', mw.authAdminApi, http(api.actions.browse));

  // ## Snippets
  router.get('/snippets', mw.authAdminApi, http(api.snippets.browse));
  router.get('/snippets/:id', mw.authAdminApi, http(api.snippets.read));
  router.post('/snippets', mw.authAdminApi, http(api.snippets.add));
  router.put('/snippets/:id', mw.authAdminApi, http(api.snippets.edit));
  router.delete('/snippets/:id', mw.authAdminApi, http(api.snippets.destroy));

  // ## Custom theme settings
  router.get('/custom_theme_settings', mw.authAdminApi, http(api.customThemeSettings.browse));
  router.put('/custom_theme_settings', mw.authAdminApi, http(api.customThemeSettings.edit));

  // Search index
  router.get('/search-index/posts', mw.authAdminApi, http(api.searchIndex.fetchPosts));
  router.get('/search-index/pages', mw.authAdminApi, http(api.searchIndex.fetchPages));
  router.get('/search-index/tags', mw.authAdminApi, http(api.searchIndex.fetchTags));
  router.get('/search-index/users', mw.authAdminApi, http(api.searchIndex.fetchUsers));

  return router;
};
