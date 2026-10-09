module.exports = {
  get entry() {
    return require('./entry').entryController;
  },

  get collection() {
    return require('./collection');
  },

  get rss() {
    return require('./rss').rssController;
  },

  get previews() {
    return require('./previews');
  },

  get channel() {
    return require('./channel');
  },

  get static() {
    return require('./static');
  },
};
