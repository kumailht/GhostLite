const errors = require('@tryghost/errors');
const logging = require('@tryghost/logging');
const config = require('../../../shared/config');
const urlUtils = require('../../../shared/url-utils').default;
const { GhostMailer } = require('../../lib/mail');
const adapterManager = require('../../services/adapter-manager').default;
const ImportManager = require('./import-manager');
const JSONHandler = require('./handlers/json');
const MarkdownHandler = require('./handlers/markdown');
const DataImporter = require('./importers/data');
const { createContentFileHandlers, createContentFileImporters } = require('./content-files');
const SiteFileRestorer = require('./site-files');

let instance;

module.exports = {
  init({ jobsService }) {
    // Every boot builds its own importer: the handlers and importers hold storage
    // adapters resolved from the configuration of the boot that built them, and an
    // in-process restart (test harness) points that configuration elsewhere.
    instance = new ImportManager({
      jobsService,
      importsStorage: adapterManager.getAdapter('storage:imports'),
      handlers: [...createContentFileHandlers(), JSONHandler, MarkdownHandler],
      importers: [...createContentFileImporters(), DataImporter],
      mailer: new GhostMailer(),
      config,
      urlUtils,
      logging,
      // Required lazily: these services load the importer's own dependencies
      siteFileRestorer: new SiteFileRestorer({
        get themeService() {
          return require('../../services/themes');
        },
        get routeSettings() {
          return require('../../services/route-settings');
        },
        get customRedirects() {
          return require('../../services/custom-redirects');
        },
        parseYaml: (content) =>
          require('../../services/custom-redirects/redirect-config-parser').parseYaml(content),
        get models() {
          return require('../../models');
        },
      }),
      notify: (notification) =>
        require('../../api').endpoints.notifications.add(
          { notifications: [notification] },
          { context: { internal: true } },
        ),
    });
    return instance;
  },

  getInstance() {
    if (!instance) {
      throw new errors.IncorrectUsageError({
        message: 'Site importer used before init(). Call init() from boot first.',
      });
    }
    return instance;
  },
};
