const urlUtils = require('../../../shared/url-utils').default;
const config = require('../../../shared/config');
const SettingsHelpers = require('./settings-helpers');

module.exports = new SettingsHelpers({ urlUtils, config });
