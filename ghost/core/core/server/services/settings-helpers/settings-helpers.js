const net = require('net');
const tpl = require('@tryghost/tpl');
const errors = require('@tryghost/errors');
const emailAddressParser = require('../email-address/email-address-parser');
const logging = require('@tryghost/logging');
const debug = require('@tryghost/debug')('services:settings-helpers');

const messages = {
  incorrectKeyType: 'type must be one of "direct" or "connect".',
};

class SettingsHelpers {
  constructor({ settingsCache, urlUtils, config, labs, limitService }) {
    this.settingsCache = settingsCache;
    this.urlUtils = urlUtils;
    this.config = config;
    this.labs = labs;
    this.limitService = limitService;
  }

  // GhostLite has no members, so every members setting reads as off.
  isMembersEnabled() {
    return false;
  }

  isMembersInviteOnly() {
    return false;
  }

  allowSelfSignup() {
    return false;
  }

  /**
   * @param {'direct' | 'connect'} type - The "type" of keys to fetch from settings
   * @returns {{publicKey: string, secretKey: string} | null}
   */
  getStripeKeys(type) {
    if (type !== 'direct' && type !== 'connect') {
      throw new errors.IncorrectUsageError({ message: tpl(messages.incorrectKeyType) });
    }

    // secretlint-disable-next-line @secretlint/secretlint-rule-pattern
    const secretKey = this.settingsCache.get(
      `stripe_${type === 'connect' ? 'connect_' : ''}secret_key`,
    );
    const publicKey = this.settingsCache.get(
      `stripe_${type === 'connect' ? 'connect_' : ''}publishable_key`,
    );

    if (!secretKey || !publicKey) {
      return null;
    }

    return {
      secretKey,
      publicKey,
    };
  }

  /**
   * @returns {{publicKey: string, secretKey: string} | null}
   */
  getActiveStripeKeys() {
    const stripeDirect = this.config.get('stripeDirect');

    if (stripeDirect) {
      return this.getStripeKeys('direct');
    }

    const connectKeys = this.getStripeKeys('connect');

    if (!connectKeys) {
      return this.getStripeKeys('direct');
    }

    return connectKeys;
  }

  isStripeConnected() {
    return this.getActiveStripeKeys() !== null;
  }

  arePaidMembersEnabled() {
    return false;
  }

  getFirstpromoterId() {
    if (!this.settingsCache.get('firstpromoter')) {
      return null;
    }
    return this.settingsCache.get('firstpromoter_id');
  }

  /**
   * @deprecated
   * Please don't make up new email addresses: use the default email addresses
   */
  getDefaultEmailDomain() {
    if (this.#managedEmailEnabled()) {
      const customSendingDomain = this.#managedSendingDomain();
      if (customSendingDomain) {
        return customSendingDomain;
      }
    }

    const url = this.urlUtils
      .urlFor('home', true)
      .match(new RegExp('^https?://([^/:?#]+)(?:[/:?#]|$)', 'i'));
    const domain = (url && url[1]) || '';
    if (domain.startsWith('www.')) {
      return domain.substring('www.'.length);
    }
    return domain;
  }

  getMembersSupportAddress() {
    const supportAddress = this.settingsCache.get('members_support_address');

    if (!supportAddress) {
      // In the new flow, we make a difference between an empty setting (= use default) and a 'noreply' setting (=use noreply @ domain)
      // Also keep the name of the default email!
      return emailAddressParser.stringify(this.getDefaultEmail());
    }

    // Any fromAddress without domain uses site domain, like default setting `noreply`
    if (supportAddress.indexOf('@') < 0) {
      return `${supportAddress}@${this.getDefaultEmailDomain()}`;
    }
    return supportAddress;
  }

  getDefaultEmailAddress() {
    return this.getDefaultEmail().address;
  }

  /**
   * @deprecated
   * Please start using the new EmailAddressService
   */
  getLegacyNoReplyAddress() {
    return `noreply@${this.getDefaultEmailDomain()}`;
  }

  getDefaultEmail() {
    // parse the email here and remove the sender name
    // E.g. when set to "bar" <from@default.com>
    const configAddress = this.config.get('mail:from');
    const parsed = emailAddressParser.parse(configAddress);
    if (parsed) {
      return parsed;
    }

    // For missing configs, we default to the old flow
    logging.warn(
      'Missing mail.from config, falling back to a generated email address. Please update your config file and set a valid from address',
    );
    return {
      address: this.getLegacyNoReplyAddress(),
    };
  }

  areDonationsEnabled() {
    return false;
  }

  /**
   * Generates an array of the blocked email domains from both config and settings
   * Normalizes the stored values by trimming, converting to lowercase and keeping only the email domain, e.g. 'hello@spam.xyz' -> 'spam.xyz'
   * Filters out domains without a dot
   * Returns an array of unique domains
   *
   * @returns {string[]}
   */
  getAllBlockedEmailDomains() {
    let configBlocklist = this.config.get('spam:blocked_email_domains') || [];
    let settingsBlocklist = this.settingsCache.get('blocked_email_domains') || [];

    const normaliseDomains = (domain) => domain && domain.trim().toLowerCase().split('@').pop();
    const filterValidDomains = (domain) => domain && domain.includes('.');

    configBlocklist = Array.isArray(configBlocklist)
      ? configBlocklist.map(normaliseDomains).filter(filterValidDomains)
      : [];
    settingsBlocklist = Array.isArray(settingsBlocklist)
      ? settingsBlocklist.map(normaliseDomains).filter(filterValidDomains)
      : [];

    return Array.from(new Set([...configBlocklist, ...settingsBlocklist]));
  }

  #managedEmailEnabled() {
    return !!this.config.get('hostSettings:managedEmail:enabled');
  }

  #managedSendingDomain() {
    return this.config.get('hostSettings:managedEmail:sendingDomain');
  }
}

module.exports = SettingsHelpers;
