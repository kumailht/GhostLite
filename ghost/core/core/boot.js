// The Ghost Boot Sequence
// -----------------------
// - This is intentionally one big file at the moment, so that we don't have to follow boot logic all over the place
// - This file is FULL of debug statements so we can see timings for the various steps because the boot needs to be as fast as possible
// - As we manage to break the codebase down into distinct components for e.g. the frontend, their boot logic can be offloaded to them
// - app.js is separate as the first example of each component having it's own app.js file colocated with it, instead of inside of server/web
//
// IMPORTANT:
// ----------
// The only global requires here should be overrides + debug so we can monitor timings with DEBUG = ghost: boot * node ghost
require('./server/overrides');
const debug = require('@tryghost/debug')('boot');
// END OF GLOBAL REQUIRES

/**
 * Helper class to create consistent log messages
 */
class BootLogger {
  /**
   * @param {{info: (message: string) => unknown}} logging
   * @param {{metric: (name: string, time: number) => unknown}} metrics
   * @param {number} startTime
   */
  constructor(logging, metrics, startTime) {
    this.logging = logging;
    this.metrics = metrics;
    this.startTime = startTime;
  }
  /**
   * @param {string} message
   * @returns {void}
   */
  log(message) {
    const { logging, startTime } = this;
    logging.info(`Ghost ${message} in ${(Date.now() - startTime) / 1000}s`);
  }
  /**
   * @param {string} name
   * @param {number} [initialTime]
   * @returns {void}
   */
  metric(name, initialTime) {
    const { metrics, startTime } = this;

    if (!initialTime) {
      initialTime = startTime;
    }

    metrics.metric(name, Date.now() - initialTime);
  }
}

/**
 * Helper function to handle sending server ready notifications
 * @param {string} [error]
 */
function notifyServerReady(error) {
  const notify = require('./server/notify');

  if (error) {
    debug('Notifying server ready (error)');
    notify.notifyServerReady(error);
  } else {
    debug('Notifying server ready (success)');
    notify.notifyServerReady();
  }
}

/**
 * Get the Database into a ready state
 * - DatabaseStateManager handles doing all this for us
 *
 * @param {object} options
 * @param {object} options.config
 */
async function initDatabase({ config }) {
  const DatabaseStateManager = require('./server/data/db/database-state-manager');
  const dbStateManager = new DatabaseStateManager({
    knexMigratorFilePath: config.get('paths:appRoot'),
  });
  await dbStateManager.makeReady();

  const databaseInfo = require('./server/data/db/info');
  await databaseInfo.init();
}

/**
 * Core is intended to be all the bits of Ghost that are fundamental and we can't do anything without them!
 * (There's more to do to make this true)
 * @param {object} options
 * @param {object} options.ghostServer
 * @param {object} options.config
 */
async function initCore({ ghostServer, config }) {
  debug('Begin: initCore');

  // Validate configured adapters up-front so misconfiguration fails at boot
  // rather than on first lazy use (e.g. first image upload or scheduled job)
  debug('Begin: adapters');
  const adapterManager = require('./server/services/adapter-manager').default;
  adapterManager.init();
  debug('End: adapters');

  // Limit image processing to the configured image formats before anything
  // can process an image
  debug('Begin: image upload config');
  const { restrictImageDecoders } = require('./server/lib/image/image-decoders');
  const {
    IMAGE_UPLOAD_TYPES,
    getIgnoredImageContentTypes,
  } = require('./server/lib/image/image-content');
  const uploads = config.get('uploads');
  restrictImageDecoders(IMAGE_UPLOAD_TYPES.flatMap((type) => uploads[type]?.extensions ?? []));

  // Image uploads can only be stored as image types, so point out any
  // configured types that will be ignored
  for (const type of IMAGE_UPLOAD_TYPES) {
    const ignored = getIgnoredImageContentTypes(uploads[type]?.contentTypes ?? []);
    if (ignored.length > 0) {
      require('@tryghost/logging').warn(
        `Ignoring uploads.${type}.contentTypes that are not image types: ${ignored.join(', ')}`,
      );
    }
  }
  debug('End: image upload config');

  // URL Utils is a bit slow, put it here so the timing is visible separate from models
  debug('Begin: Load urlUtils');
  require('./shared/url-utils');
  debug('End: Load urlUtils');

  // Settings are a core concept we use settings to store key-value pairs used in critical pathways as well as public data like the site title
  debug('Begin: settings');
  const settings = require('./server/services/settings/settings-service');
  await settings.init();
  debug('End: settings');

  debug('Begin: i18n');
  const i18n = require('./server/services/i18n');
  await i18n.init();
  debug('End: i18n');

  if (ghostServer) {
    // Jobs Service allows parts of Ghost to run in the background
    debug('Begin: Jobs Service');
    const jobsService = require('./server/services/jobs-service');

    ghostServer.registerCleanupTask(async () => {
      await jobsService.shutdown({ timeoutMs: config.get('server:shutdownTimeout') });
    }, 'Jobs Service (in-memory)');
    debug('End: Jobs Service');
  }

  debug('End: initCore');
}

/**
 * These are services required by Ghost's frontend.
 * @param {object} options
 * @param {BootLogger} options.bootLogger

 */
async function initServicesForFrontend({ bootLogger }) {
  debug('Begin: initServicesForFrontend');

  debug('Begin: Routing Settings');
  const routeSettings = require('./server/services/route-settings');
  await routeSettings.init();
  debug('End: Routing Settings');

  debug('Begin: Redirects');
  const customRedirects = require('./server/services/custom-redirects');
  await customRedirects.init();
  debug('End: Redirects');

  debug('Begin: Themes');
  // customThemeSettingsService.api must be initialized before any theme activation occurs
  const customThemeSettingsService = require('./server/services/custom-theme-settings');
  customThemeSettingsService.init();

  const themeService = require('./server/services/themes');
  const themeServiceStart = Date.now();
  await themeService.init();
  bootLogger.metric('theme-service-init', themeServiceStart);
  debug('End: Themes');

  debug('End: initServicesForFrontend');
}

/**
 * Frontend is intended to be just Ghost's frontend
 */
function initFrontend() {
  debug('Begin: initFrontend');

  const helperService = require('./frontend/services/helpers');
  helperService.init();

  debug('End: initFrontend');
}

/**
 * At the moment we load our express apps all in one go, they require themselves and are co-located
 * What we want is to be able to optionally load various components and mount them
 * So eventually this function should go away
 * @param {Object} options
 * @param {boolean} options.backend
 * @param {boolean} options.frontend
 * @param {Object} options.config
 */
async function initExpressApps({ frontend, backend, config }) {
  debug('Begin: initExpressApps');

  const parentApp = require('./server/web/parent/app')();
  const vhost = require('@tryghost/mw-vhost');

  // Mount the express apps on the parentApp
  if (backend) {
    // ADMIN + API
    const backendApp = require('./server/web/parent/backend')();
    parentApp.use(vhost(config.getBackendMountPath(), backendApp));
  }

  if (frontend) {
    // SITE + MEMBERS
    const urlService = require('./server/services/url');
    const frontendApp = require('./server/web/parent/frontend')({ urlService });
    parentApp.use(vhost(config.getFrontendMountPath(), frontendApp));
  }

  debug('End: initExpressApps');
  return parentApp;
}

/**
 * Dynamic routing is generated from the routes.yaml file
 * When Ghost's DB and core are loaded, we can access this file and call routing.routingManager.start
 * However this _must_ happen after the express Apps are loaded, hence why this is here and not in initFrontend
 * Routing is currently tightly coupled between the frontend and backend
 *
 * Runs on every boot, not just a frontend one: it both mounts routers on the
 * site app and tells the URL service about them, and only the first needs a
 * frontend. The APIs, the email service and webhooks all build URLs, so a
 * backend-only boot that skipped this resolved every resource to /404/.
 */
async function initDynamicRouting({ frontend }) {
  debug('Begin: Dynamic Routing');
  const routing = require('./frontend/services/routing');
  const routeSettingsModule = require('./server/services/route-settings');
  const urlService = require('./server/services/url');
  const bridge = require('./bridge');
  bridge.init();

  // With a frontend, initFrontend has already called this to build the site
  // app's router. Without one there is nothing to mount, but the URL service
  // still has to be handed to RouterManager before the routers register — so
  // call the same init and discard the express router it returns.
  if (!frontend) {
    routing.routerManager.init({ urlService });
  }

  await routeSettingsModule.service.start({
    routerManager: routing.routerManager,
    urlService,
  });

  debug('End: Dynamic Routing');
}

/**
 * The app service cannot be loaded unless the frontend is enabled
 * In future, the logic to determine whether this should be loaded should be in the service loader
 */
async function initAppService() {
  debug('Begin: App Service');
  const appService = require('./frontend/services/apps');
  await appService.init();
  debug('End: App Service');
}

/**
 * Services are components that make up part of Ghost and need initializing on boot
 * These services should all be part of core, frontend services should be loaded with the frontend
 * We are working towards this being a service loader, with the ability to make certain services optional
 */
async function initServices({ jobsService }) {
  debug('Begin: initServices');

  debug('Begin: Services');
  const permissions = require('./server/services/permissions');
  const postScheduling = require('./server/services/post-scheduling').default;
  const mediaInliner = require('./server/services/media-inliner');
  const contentImport = require('./server/services/content-import');
  const adapterManager = require('./server/services/adapter-manager').default;
  const { withErrorCapture } = require('./server/adapters/scheduling/error-capture');

  const schedulerAdapter = withErrorCapture(adapterManager.getAdapter('scheduling'));
  schedulerAdapter.run();

  await Promise.all([
    permissions.init(),
    mediaInliner.init(),
    contentImport.init(),
  ]);

  debug('Begin: Register job handlers');
  const registerJobHandlers =
    require('./server/services/jobs-service/register-job-handlers').default;
  const siteImporter = require('./server/data/importer').init({ jobsService });
  registerJobHandlers({
    jobsService,
    mediaInliner: mediaInliner.getInstance(),
    siteImporter,
  });
  await jobsService.start();
  debug('End: Register job handlers');

  if (schedulerAdapter.rescheduleOnBoot) {
    await postScheduling.rescheduleAll();
  }

  debug('End: Services');

  debug('End: initServices');
}

/**
 * Kick off recurring jobs and background services
 * These are things that happen on boot, but we don't need to wait for them to finish
 * Later, this might be a service hook

 * @param {object} options
 * @param {object} options.config
 */
async function initBackgroundServices({ config }) {
  debug('Begin: initBackgroundServices');

  // Load all inactive themes
  const themeService = require('./server/services/themes');
  themeService.loadInactiveThemes();

  // we don't want to kick off background services that will interfere with tests
  if (process.env.NODE_ENV.startsWith('test')) {
    return;
  }

  debug('End: initBackgroundServices');
}

/**
 * ----------------------------------
 * Boot Ghost - The magic starts here
 * ----------------------------------
 *
 * - This function is written with async/await so you can read, line by line, what happens on boot
 * - All the functions above handle init/boot logic for a single component

 * @returns {Promise<object>} ghostServer
 */
async function bootGhost({ backend = true, frontend = true, server = true } = {}) {
  // Metrics
  const startTime = Date.now();
  debug('Begin Boot');

  // We need access to these variables in both the try and catch block
  let bootLogger;
  let config;
  let flushLogsAndMetrics;
  let ghostServer;
  let logging;
  let metrics;

  // These require their own try-catch block and error format, because we can't log an error if logging isn't working
  try {
    // Step 0 - Load config and logging - fundamental required components
    // Version is required by logging & Migration config & so is fundamental to booting
    // However, it involves reading package.json so its slow & it's here for visibility on that slowness
    debug('Begin: Load version info');
    require('@tryghost/version');
    debug('End: Load version info');

    // Loading config must be the first thing we do, because it is required for absolutely everything
    debug('Begin: Load config');
    config = require('./shared/config');
    debug('End: Load config');

    // Logging is also used absolutely everywhere
    debug('Begin: Load logging');
    logging = require('@tryghost/logging');
    metrics = require('@tryghost/metrics');
    flushLogsAndMetrics = require('./shared/flush').flushLogsAndMetrics;
    bootLogger = new BootLogger(logging, metrics, startTime);
    debug('End: Load logging');

    // At this point logging is required, so we can handle errors better

    // Add a process handler to capture and log unhandled rejections
    debug('Begin: Add unhandled rejection handler');
    process.on('unhandledRejection', (error) => {
      logging.error('Unhandled rejection:', error);
    });
    debug('End: Add unhandled rejection handler');
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  }

  try {
    // Step 1 - Start server with minimal app in global maintenance mode
    debug('Begin: load server + minimal app');
    const rootApp = require('./app')();

    if (server) {
      const { GhostServer } = require('./server/ghost-server');
      ghostServer = new GhostServer({
        url: config.getSiteUrl(),
        env: config.get('env'),
        serverConfig: config.get('server'),
      });
      await ghostServer.start(rootApp);
      bootLogger.log('server started');
      debug('End: load server + minimal app');
    }

    // Step 2 - Get the DB ready
    debug('Begin: Get DB ready');
    await initDatabase({ config });
    bootLogger.log('database ready');
    debug('End: Get DB ready');

    // Step 3 - Load Ghost with all its services
    debug('Begin: Load Ghost Services & Apps');
    await initCore({ ghostServer, config });

    await initServicesForFrontend({ bootLogger });

    if (frontend) {
      initFrontend();
    }
    const ghostApp = await initExpressApps({ frontend, backend, config });

    await initDynamicRouting({ frontend });

    if (frontend) {
      await initAppService();
    }

    const jobsService = require('./server/services/jobs-service').init();

    await initServices({ jobsService });

    debug('End: Load Ghost Services & Apps');

    // Step 4 - Mount the full Ghost app onto the minimal root app & disable maintenance mode
    debug('Begin: mountGhost');
    rootApp.disable('maintenance');
    rootApp.use(config.getSubdir(), ghostApp);
    debug('End: mountGhost');

    // Step 5 - We are technically done here - let everyone know!
    bootLogger.log('booted');
    bootLogger.metric('boot-time');
    notifyServerReady();

    // Step 6 - Init our background services, we don't wait for this to finish
    initBackgroundServices({ config });

    // If we pass the env var, kill Ghost
    if (process.env.GHOST_CI_SHUTDOWN_AFTER_BOOT) {
      await flushLogsAndMetrics();
      process.exit(0);
    }

    // We return the server purely for testing purposes
    if (server) {
      debug('End Boot: Returning Ghost Server');
      return ghostServer;
    } else {
      debug('End boot: Returning Root App');
      return rootApp;
    }
  } catch (error) {
    const errors = require('@tryghost/errors');

    // Ensure the error we have is an ignition error
    let serverStartError = error;
    if (!errors.utils.isGhostError(serverStartError)) {
      serverStartError = new errors.InternalServerError({
        message: serverStartError.message,
        err: serverStartError,
      });
    }

    logging.error(serverStartError);
    // fallback in case logger fails to flush before exit
    console.error(serverStartError); // eslint-disable-line no-console

    // If ghost was started and something else went wrong, we shut it down
    if (ghostServer) {
      notifyServerReady(serverStartError);
      ghostServer.shutdown(2);
    } else {
      // Ghost server failed to start, drain the log transports before exiting
      await flushLogsAndMetrics();
      process.exit(2);
    }
  }
}

module.exports = bootGhost;
