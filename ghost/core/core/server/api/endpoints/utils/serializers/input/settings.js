const _ = require('lodash');
const url = require('./utils/url');
const localUtils = require('../../index');
const settingsCache = require('../../../../../../shared/settings-cache');
const { WRITABLE_KEYS_ALLOWLIST } = require('../../../../../../shared/labs');

const EDITABLE_SETTINGS = [
  'title',
  'description',
  'logo',
  'cover_image',
  'icon',
  'locale',
  'timezone',
  'codeinjection_head',
  'codeinjection_foot',
  'facebook',
  'twitter',
  'threads',
  'bluesky',
  'mastodon',
  'tiktok',
  'youtube',
  'instagram',
  'linkedin',
  'navigation',
  'secondary_navigation',
  'meta_title',
  'meta_description',
  'llms_enabled',
  'og_image',
  'og_title',
  'og_description',
  'twitter_image',
  'twitter_title',
  'twitter_description',
  'is_private',
  'password',
  'unsplash',
  'shared_views',
  'accent_color',
  'labs',
  'body_font',
  'heading_font',
  'require_email_mfa',
];

module.exports = {
  edit(apiConfig, frame) {
    // CASE: allow shorthand syntax where a single key and value are passed to edit instead of object and options
    if (_.isString(frame.data)) {
      frame.data = { settings: [{ key: frame.data, value: frame.options }] };
    }

    const settings = settingsCache.getAll();

    if (!localUtils.isInternal(frame)) {
      // Ignore and drop all values not in the EDITABLE_SETTINGS list unless this is an internal request
      frame.data.settings = frame.data.settings.filter((setting) => {
        return EDITABLE_SETTINGS.includes(setting.key);
      });
    }

    frame.data.settings.forEach((setting) => {
      const settingType = settings[setting.key] ? settings[setting.key].type : '';

      // @TODO: handle these transformations in a centralized API place (these rules should apply for ALL resources)

      // CASE: Ensure we won't forward strings, otherwise model events or model interactions can fail
      if (settingType === 'boolean' && (setting.value === '0' || setting.value === '1')) {
        setting.value = !!+setting.value;
      }

      // CASE: Ensure we won't forward strings, otherwise model events or model interactions can fail
      if (settingType === 'boolean' && (setting.value === 'false' || setting.value === 'true')) {
        setting.value = setting.value === 'true';
      }

      // CASE: filter labs to allowlist
      if (setting.key === 'labs') {
        const inputLabsValue = JSON.parse(setting.value);
        const filteredLabsValue = {};

        for (const flag in inputLabsValue) {
          if (WRITABLE_KEYS_ALLOWLIST.includes(flag)) {
            filteredLabsValue[flag] = inputLabsValue[flag];
          }
        }

        setting.value = JSON.stringify(filteredLabsValue);
      }

      setting = url.forSetting(setting);
    });
  },
};
