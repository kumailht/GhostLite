const apiFramework = require('@tryghost/api-framework');
const localUtils = require('./utils');

// ESLint Override Notice
// This is a valid index.js file - it just exports a lot of stuff!
// Long term we would like to change the API architecture to reduce this file,
// but that's not the problem the index.js max - line eslint "proxy" rule is there to solve.

module.exports = {
  get authentication() {
    return apiFramework.pipeline(require('./authentication'), localUtils);
  },

  get db() {
    return apiFramework.pipeline(require('./db'), localUtils);
  },

  get exports() {
    return apiFramework.pipeline(require('./exports'), localUtils);
  },

  get integrations() {
    return apiFramework.pipeline(require('./integrations'), localUtils);
  },

  // @TODO: transform
  get session() {
    return require('./session');
  },

  get schedules() {
    return apiFramework.pipeline(require('./schedules'), localUtils);
  },

  get pages() {
    return apiFramework.pipeline(require('./pages'), localUtils);
  },

  get redirects() {
    return apiFramework.pipeline(require('./redirects'), localUtils);
  },

  get roles() {
    return apiFramework.pipeline(require('./roles'), localUtils);
  },

  get slugs() {
    return apiFramework.pipeline(require('./slugs'), localUtils);
  },

  get posts() {
    return apiFramework.pipeline(require('./posts'), localUtils);
  },

  get invites() {
    return apiFramework.pipeline(require('./invites'), localUtils);
  },

  get mail() {
    return apiFramework.pipeline(require('./mail'), localUtils);
  },

  get notifications() {
    return apiFramework.pipeline(require('./notifications'), localUtils);
  },

  get settings() {
    return apiFramework.pipeline(require('./settings'), localUtils);
  },

  get images() {
    return apiFramework.pipeline(require('./images'), localUtils);
  },

  get media() {
    return apiFramework.pipeline(require('./media'), localUtils);
  },

  get files() {
    return apiFramework.pipeline(require('./files'), localUtils);
  },

  get tags() {
    return apiFramework.pipeline(require('./tags'), localUtils);
  },

  get users() {
    return apiFramework.pipeline(require('./users'), localUtils);
  },

  get previews() {
    return apiFramework.pipeline(require('./previews'), localUtils);
  },

  get oembed() {
    return apiFramework.pipeline(require('./oembed'), localUtils);
  },

  get config() {
    return apiFramework.pipeline(require('./config'), localUtils);
  },

  get themes() {
    return apiFramework.pipeline(require('./themes'), localUtils);
  },

  get actions() {
    return apiFramework.pipeline(require('./actions'), localUtils);
  },

  get site() {
    return apiFramework.pipeline(require('./site'), localUtils);
  },

  get snippets() {
    return apiFramework.pipeline(require('./snippets'), localUtils);
  },

  get customThemeSettings() {
    return apiFramework.pipeline(require('./custom-theme-settings'), localUtils);
  },

  get featurebase() {
    return apiFramework.pipeline(require('./featurebase'), localUtils);
  },

  get serializers() {
    return require('./utils/serializers');
  },

  get searchIndex() {
    return apiFramework.pipeline(require('./search-index'), localUtils);
  },

  /**
   * Content API Controllers
   *
   * @NOTE:
   *
   * Please create separate controllers for Content & Admin API. The goal is to expose `api.content` and
   * `api.admin` soon. Need to figure out how serializers & validation works then.
   */
  get pagesPublic() {
    return apiFramework.pipeline(require('./pages-public'), localUtils, 'content');
  },

  get tagsPublic() {
    return apiFramework.pipeline(require('./tags-public'), localUtils, 'content');
  },

  get publicSettings() {
    return apiFramework.pipeline(require('./settings-public'), localUtils, 'content');
  },

  get postsPublic() {
    return apiFramework.pipeline(require('./posts-public'), localUtils, 'content');
  },

  get authorsPublic() {
    return apiFramework.pipeline(require('./authors-public'), localUtils, 'content');
  },

  get searchIndexPublic() {
    return apiFramework.pipeline(require('./search-index-public'), localUtils, 'content');
  },
};
