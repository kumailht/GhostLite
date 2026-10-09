const debug = require('@tryghost/debug')('api:endpoints:utils:serializers:output:pages');
const mappers = require('./mappers');

module.exports = {
  // 204 No Content — see posts.js destroy
  destroy(models, apiConfig, frame) {
    debug('destroy');

    frame.response = { pages: [] };
  },

  async all(models, apiConfig, frame) {
    debug('all');

    // CASE: e.g. destroy returns null
    if (!models) {
      return;
    }
    const pages = [];


    if (models.meta) {
      for (const model of models.data) {
        const page = await mappers.pages(model, frame);
        pages.push(page);
      }
      frame.response = {
        pages,
        meta: models.meta,
      };

      return;
    }
    const page = await mappers.pages(models, frame);
    frame.response = {
      pages: [page],
    };
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
