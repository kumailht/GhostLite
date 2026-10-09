const PostsService = require('./posts-service');
const PostsExporter = require('./posts-exporter');
const url = require('../../../server/api/endpoints/utils/serializers/output/utils/url');

/**
 * @returns {InstanceType<PostsService>} instance of the PostsService
 */
const getPostServiceInstance = () => {
  const urlUtils = require('../../../shared/url-utils').default;
  const labs = require('../../../shared/labs');
  const models = require('../../models');
  const PostStats = require('./stats/post-stats');

  const postStats = new PostStats();

  const postsExporter = new PostsExporter({
    models: {
      Post: models.Post,
    },
    getPostUrl(post) {
      const jsonModel = post.toJSON();
      url.forPost(post.id, jsonModel, { options: {} });
      return jsonModel.url;
    },
  });

  return new PostsService({
    urlUtils: urlUtils,
    models: models,
    isSet: (flag) => labs.isSet(flag), // don't use bind, that breaks test subbing of labs
    stats: postStats,
    postsExporter,
  });
};

module.exports = getPostServiceInstance;
// exposed for testing purposes only
module.exports.PostsService = PostsService;
