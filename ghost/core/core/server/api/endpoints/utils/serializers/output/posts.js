const debug = require('@tryghost/debug')('api:endpoints:utils:serializers:output:posts');
const mappers = require('./mappers');
const { createCSVTransform } = require('./posts-csv-transform');
const { createCSVStreamResponse } = require('./stream-csv-response');

module.exports = {
  // 204 No Content — bookshelf clears the destroyed model's attributes
  // (only relations remain), so there is nothing serializable left and
  // computing its URL would hand the URL service a relations-only resource.
  destroy(models, apiConfig, frame) {
    debug('destroy');

    frame.response = { posts: [] };
  },

  async all(models, apiConfig, frame) {
    debug('all');

    // CASE: e.g. destroy returns null
    if (!models) {
      return;
    }
    const posts = [];

    if (models.meta) {
      for (const model of models.data) {
        const post = await mappers.posts(model, frame);
        posts.push(post);
      }
      frame.response = {
        posts,
        meta: models.meta,
      };

      return;
    }
    const post = await mappers.posts(models, frame);
    frame.response = {
      posts: [post],
    };
  },

  exportCSV(models, apiConfig, frame) {
    frame.response = createCSVStreamResponse({
      source: models.data,
      transform: createCSVTransform(),
      filename: models.filename,
    });
  },

  importCSV(result, apiConfig, frame) {
    frame.response = result;
  },

  bulkEdit(bulkActionResult, _apiConfig, frame) {
    frame.response = {
      bulk: {
        action: frame.data.action,
        meta: {
          stats: {
            successful: bulkActionResult.successful,
            unsuccessful: bulkActionResult.unsuccessful,
          },
          errors: bulkActionResult.errors,
          unsuccessfulData: bulkActionResult.unsuccessfulData,
        },
      },
    };
  },

  bulkDestroy(bulkActionResult, _apiConfig, frame) {
    frame.response = {
      bulk: {
        meta: {
          stats: {
            successful: bulkActionResult.successful,
            unsuccessful: bulkActionResult.unsuccessful,
          },
          errors: bulkActionResult.errors,
        },
      },
    };
  },
};
