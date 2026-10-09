// NOTE: these tables can be optionally included to have full db-like export
const BACKUP_TABLES = [
  'actions',
  'api_keys',
  'brute',
  'integrations',
  'invites',
  'migrations',
  'migrations_lock',
  'permissions',
  'permissions_roles',
  'permissions_users',
  'sessions',
  'mobiledoc_revisions',
  'post_revisions',
  'jobs',
];

// NOTE: exposing only tables which are going to be included in a "default" export file
//       they should match with the data that is supported by the importer.
//       In the future it's best to move to resource-based exports instead of database-based ones
const TABLES_ALLOWLIST = [
  'posts',
  'posts_authors',
  'posts_meta',
  'posts_tags',
  'roles',
  'roles_users',
  'settings',
  'custom_theme_settings',
  'tags',
  'users',
  'snippets',
];

// NOTE: these are non-core settings keys which should never end up in the export file
//       (the whole core group is always excluded)
const SETTING_KEYS_BLOCKLIST = [];

module.exports = {
  BACKUP_TABLES,
  TABLES_ALLOWLIST,
  SETTING_KEYS_BLOCKLIST,
};
