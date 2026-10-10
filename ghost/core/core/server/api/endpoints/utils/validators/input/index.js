// ESLint Override Notice
// This is a valid index.js file - it just exports a lot of stuff!
// Long term we would like to change the API architecture to reduce this file,
// but that's not the problem the index.js max - line eslint "proxy" rule is there to solve.

module.exports = {
  get password_reset() {
    return require('./password_reset');
  },

  get setup() {
    return require('./setup');
  },

  get posts() {
    return require('./posts');
  },

  get pages() {
    return require('./pages');
  },

  get invites() {
    return require('./invites');
  },

  get invitations() {
    return require('./invitations');
  },

  get settings() {
    return require('./settings');
  },

  get tags() {
    return require('./tags');
  },

  get users() {
    return require('./users');
  },

  get images() {
    return require('./images');
  },

  get oembed() {
    return require('./oembed');
  },

  get snippets() {
    return require('./snippets');
  },
};
