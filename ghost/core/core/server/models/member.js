const ghostBookshelf = require('./base');

// GhostLite has no members. The table stays until the schema cleanup, and the
// model stays registered because other models still name it in their relations.
const Member = ghostBookshelf.Model.extend({
  tableName: 'members',
});

const Members = ghostBookshelf.Collection.extend({
  model: Member,
});

module.exports = {
  Member: ghostBookshelf.model('Member', Member),
  Members: ghostBookshelf.collection('Members', Members),
};
