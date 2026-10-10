const models = require('../../models');
const tpl = require('@tryghost/tpl');
const errors = require('@tryghost/errors');
const pick = require('lodash/pick');
const getPostServiceInstance = require('../../services/posts/posts-service-instance');
const postsService = getPostServiceInstance();
const { rejectPostsContentApiRestrictedFieldsTransformer } = require('./utils/api-filter-utils');

const ALLOWED_INCLUDES = ['tags', 'authors', 'tiers', 'sentiment'];
const ALLOWED_READ_FIELDS = ['id', 'slug', 'uuid'];

const messages = {
  postNotFound: 'Post not found.',
  missingIdentifier: 'A post id, slug or uuid is required.',
};

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
  docName: 'posts',

  browse: {
    headers: {
      cacheInvalidate: false,
    },
    options: [
      'include',
      'filter',
      'fields',
      'formats',
      'limit',
      'order',
      'page',
      'debug',
      'absolute_urls',
      'collection',
      'skipPagination',
    ],
    validation: {
      options: {
        include: {
          values: ALLOWED_INCLUDES,
        },
        formats: {
          values: models.Post.allowedFormats,
        },
      },
    },
    permissions: true,
    query(frame) {
      const options = {
        ...frame.options,
        mongoTransformer: rejectPostsContentApiRestrictedFieldsTransformer,
      };
      return postsService.browsePosts(options);
    },
  },

  read: {
    headers: {
      cacheInvalidate: false,
    },
    options: ['include', 'fields', 'formats', 'debug', 'absolute_urls'],
    data: ALLOWED_READ_FIELDS,
    validation: {
      options: {
        include: {
          values: ALLOWED_INCLUDES,
        },
        formats: {
          values: models.Post.allowedFormats,
        },
      },
    },
    permissions: true,
    async query(frame) {
      // GET bodies bypass the framework's declared data fields. Restrict the
      // actual lookup too, before the model turns it into SQL predicates.
      const data = pick(frame.data, ALLOWED_READ_FIELDS);
      if (!Object.values(data).some(Boolean)) {
        throw new errors.BadRequestError({ message: tpl(messages.missingIdentifier) });
      }

      const options = {
        ...frame.options,
        mongoTransformer: rejectPostsContentApiRestrictedFieldsTransformer,
      };
      const model = await models.Post.findOne(data, options);
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
