const { isPlainObject } = require('lodash');
const config = require('../../../../../shared/config');
const labs = require('../../../../../shared/labs');
const databaseInfo = require('../../../../data/db/info');
const ghostVersion = require('@tryghost/version');

module.exports = function getConfigProperties() {
  const configProperties = {
    version: process.env.GHOST_BUILD_VERSION || ghostVersion.original,
    environment: config.get('env'),
    database: databaseInfo.getEngine(),
    mail: isPlainObject(config.get('mail')) ? config.get('mail').transport : '',
    useGravatar: !config.isPrivacyDisabled('useGravatar'),
    labs: labs.getAll(),
    enableDeveloperExperiments: config.get('enableDeveloperExperiments') || false,
    klipy: config.get('klipy'),
    security: config.get('security'),
  };

  return configProperties;
};
