/**
 * Settings Lib
 * A collection of utilities for handling settings including a cache
 */
const events = require('../../lib/common/events');
const models = require('../../models');
const labs = require('../../../shared/labs');
const config = require('../../../shared/config');
const adapterManager = require('../adapter-manager').default;
const SettingsCache = require('../../../shared/settings-cache');
const SettingsBREADService = require('./settings-bread-service');
const { generatePrivateSiteAccessCode } = require('./private-site-access-code');
const { obfuscatedSetting, isSecretSetting, hideValueIfSecret } = require('./settings-utils');

/**
 * @returns {SettingsBREADService} instance of the PostsService
 */
const getSettingsBREADServiceInstance = () => {
  return new SettingsBREADService({
    SettingsModel: models.Settings,
    settingsCache: SettingsCache,
    labsService: labs,
  });
};

module.exports = {
  /**
   * Initialize the cache, used in boot and in testing
   */
  async init() {
    const cacheStore = adapterManager.getAdapter('cache:settings');
    await models.Settings.populateDefaults();
    const settingsCollection = await models.Settings.findAll({ context: { internal: true } });
    SettingsCache.init(events, settingsCollection, [], cacheStore, {});

    // Validate site_uuid matches config
    this.validateSiteUuid();
  },

  /**
   * Generate and persist a new private site access code.
   *
   * The code is always generated server-side. Callers cannot provide their
   * own value, and the write runs with internal context so it can regenerate
   * a read-only access code without opening up generic settings edits.
   *
   * @returns {Promise<*>}
   */
  async regeneratePrivateSiteAccessCode() {
    return await models.Settings.edit(
      [
        {
          key: 'password',
          value: generatePrivateSiteAccessCode(),
        },
      ],
      { context: { internal: true } },
    );
  },

  /**
   * Restore the cache, used during e2e testing only
   */
  reset() {
    SettingsCache.reset(events);
  },

  /**
   * Validates that the site_uuid setting matches the configured site_uuid
   * This is a safeguard to prevent sites from running with the wrong site_uuid
   * The configured site_uuid is only used once when the site_uuid setting is set in a migration
   * Exits with an error if they differ
   */
  validateSiteUuid() {
    const configSiteUuid = config.get('site_uuid');
    const settingSiteUuid = SettingsCache.get('site_uuid');

    if (
      configSiteUuid &&
      settingSiteUuid &&
      configSiteUuid.toLowerCase() !== settingSiteUuid.toLowerCase()
    ) {
      const logging = require('@tryghost/logging');
      const errors = require('@tryghost/errors');

      logging.error(
        `Site UUID mismatch: config has '${configSiteUuid}' but database has '${settingSiteUuid}'`,
      );
      throw new errors.IncorrectUsageError({
        message: 'Site UUID configuration does not match database value',
        context:
          'Ghost will not boot if the configured site_uuid does not match the value in the settings table',
        help: 'Please check your site_uuid configuration',
        code: 'SITE_UUID_MISMATCH',
      });
    }
  },

  obfuscatedSetting,
  isSecretSetting,
  hideValueIfSecret,
  getSettingsBREADServiceInstance,
};
