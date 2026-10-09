const _ = require('lodash');
const fs = require('fs-extra');
const routeSettings = require('../../services/route-settings');
const settingsService = require('../../services/settings/settings-service');
const settingsBREADService = settingsService.getSettingsBREADServiceInstance();

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
  docName: 'settings',

  browse: {
    headers: {
      cacheInvalidate: false,
    },
    options: ['group'],
    permissions: true,
    query(frame) {
      return settingsBREADService.browse(frame.options.context);
    },
  },

  read: {
    headers: {
      cacheInvalidate: false,
    },
    options: ['key'],
    validation: {
      options: {
        key: {
          required: true,
        },
      },
    },
    permissions: {
      identifier(frame) {
        return frame.options.key;
      },
    },
    query(frame) {
      return settingsBREADService.read(frame.options.key, frame.options.context);
    },
  },

  edit: {
    headers: {
      cacheInvalidate: false,
    },
    permissions: {
      unsafeAttrsObject(frame) {
        return _.find(frame.data.settings, { key: 'labs' });
      },
    },
    async query(frame) {
      const result = await settingsBREADService.edit(frame.data.settings, frame.options);

      if (!_.isEmpty(result)) {
        frame.setHeader('X-Cache-Invalidate', '/*');
      }

      // We need to return all settings here, because we have calculated settings that might change
      const browse = await settingsBREADService.browse(frame.options.context);
      browse.meta = result.meta || {};

      return browse;
    },
  },

  regenerateAccessCode: {
    headers: {
      cacheInvalidate: false,
    },
    permissions: {
      method: 'edit',
    },
    async query(frame) {
      await settingsService.regeneratePrivateSiteAccessCode();
      frame.setHeader('X-Cache-Invalidate', '/*');

      // We need to return all settings here, because we have calculated settings that might change
      return await settingsBREADService.browse(frame.options.context);
    },
  },

  upload: {
    headers: {
      cacheInvalidate: true,
    },
    permissions: {
      method: 'edit',
    },
    async query(frame) {
      const content = await fs.readFile(frame.file.path, 'utf8');
      await routeSettings.api.upload(content);
    },
  },

  download: {
    headers: {
      disposition: {
        type: 'yaml',
        value: 'routes.yaml',
      },
      cacheInvalidate: false,
    },
    response: {
      format: 'plain',
    },
    permissions: {
      method: 'browse',
    },
    query() {
      return routeSettings.api.download();
    },
  },
};

module.exports = controller;
