const tpl = require('@tryghost/tpl');
const errors = require('@tryghost/errors');
const models = require('../../models');
const urlSerializerUtils = require('./utils/serializers/input/utils/url');
const ALLOWED_INCLUDES = ['authors', 'tags', 'tiers'];

const messages = {
  postNotFound: 'Post not found.',
};

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
  docName: 'previews',

  read: {
    headers: {
      cacheInvalidate: false,
    },
    permissions: true,
    options: ['include'],
    data: ['uuid'],
    validation: {
      options: {
        include: {
          values: ALLOWED_INCLUDES,
        },
      },
      data: {
        uuid: {
          required: true,
        },
      },
    },
    async query(frame) {
      // previews has no input serializer, so the URL force-load happens here
      urlSerializerUtils.forceUrlRelations(frame, 'posts');

      const model = await models.Post.findOne(
        Object.assign({ status: 'all' }, frame.data),
        frame.options,
      );
      if (!model) {
        throw new errors.NotFoundError({
          message: tpl(messages.postNotFound),
        });
      }

      return model;
    },
  },
};

module.exports = controller;
