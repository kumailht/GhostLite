const { isPlainObject, omit } = require('lodash');
const config = require('../../../../../shared/config');
const labs = require('../../../../../shared/labs');
const databaseInfo = require('../../../../data/db/info');
const ghostVersion = require('@tryghost/version');

const sanitizeHostSettings = (hostSettings) => {
  if (!isPlainObject(hostSettings)) {
    return hostSettings;
  }

  return omit(hostSettings, ['export.webhookSecret', 'emailVerification.webhookSecret']);
};

module.exports = function getConfigProperties() {
  const configProperties = {
    version: process.env.GHOST_BUILD_VERSION || ghostVersion.original,
    environment: config.get('env'),
    database: databaseInfo.getEngine(),
    mail: isPlainObject(config.get('mail')) ? config.get('mail').transport : '',
    useGravatar: !config.isPrivacyDisabled('useGravatar'),
    labs: labs.getAll(),
    clientExtensions: config.get('clientExtensions') || {},
    enableDeveloperExperiments: config.get('enableDeveloperExperiments') || false,
    stripeDirect: config.get('stripeDirect'),
    mailgunIsConfigured: !!(config.get('bulkEmail') && config.get('bulkEmail').mailgun),
    emailAnalytics: config.get('emailAnalytics:enabled'),
    hostSettings: sanitizeHostSettings(config.get('hostSettings')),
    klipy: config.get('klipy'),
    pintura: config.get('pintura'),
    security: config.get('security'),
  };

  if (config.get('featurebase')) {
    // Expose only the public featurebase config properties
    configProperties.featurebase = {
      enabled: config.get('featurebase:enabled'),
      organization: config.get('featurebase:organization'),
    };
  }

  if (config.get('docsbot')) {
    configProperties.docsbot = {
      enabled: config.get('docsbot:enabled'),
      id: config.get('docsbot:id'),
    };
  }

  return configProperties;
};
