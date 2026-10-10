const emailAddressParser = require('../email-address/email-address-parser');
const logging = require('@tryghost/logging');

class SettingsHelpers {
  constructor({ urlUtils, config }) {
    this.urlUtils = urlUtils;
    this.config = config;
  }

  /**
   * The site's domain without a leading `www.`, used to build fallback addresses.
   */
  getDefaultEmailDomain() {
    const url = this.urlUtils
      .urlFor('home', true)
      .match(new RegExp('^https?://([^/:?#]+)(?:[/:?#]|$)', 'i'));
    const domain = (url && url[1]) || '';
    if (domain.startsWith('www.')) {
      return domain.substring('www.'.length);
    }
    return domain;
  }

  /**
   * The address staff mail is sent from: `mail.from` in config, or
   * `noreply@<site domain>` when that isn't set.
   */
  getDefaultEmail() {
    // parse the email here and remove the sender name
    // E.g. when set to "bar" <from@default.com>
    const configAddress = this.config.get('mail:from');
    const parsed = emailAddressParser.parse(configAddress);
    if (parsed) {
      return parsed;
    }

    logging.warn(
      'Missing mail.from config, falling back to a generated email address. Please update your config file and set a valid from address',
    );
    return {
      address: `noreply@${this.getDefaultEmailDomain()}`,
    };
  }
}

module.exports = SettingsHelpers;
