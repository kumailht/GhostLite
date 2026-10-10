const _ = require('lodash');
const debug = require('@tryghost/debug')('api:endpoints:utils:serializers:output:config');

module.exports = {
  all(data, apiConfig, frame) {
    debug('all');

    const keys = [
      'version',
      'environment',
      'database',
      'mail',
      'useGravatar',
      'labs',
      'enableDeveloperExperiments',
      'klipy',
      'security',
    ];

    frame.response = {
      config: _.pick(data, keys),
    };
  },
};
