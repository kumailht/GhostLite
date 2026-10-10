/**
 * Request contract for post/page reads and writes against the Admin API.
 *
 * The Ember editor's adapters and serializers are the spec here — these
 * builders must produce the same query params and payload shapes as
 * `apps/ember-admin/app/adapters/post.js`, `adapters/page.js` and
 * `serializers/post.js`/`page.js` so the API sees identical requests from
 * either client.
 */

/**
 * Posts/pages include all relations by default on reads, but create/update
 * responses only include what is explicitly requested — so writes re-request
 * everything, including `post_revisions` for the client-side revision compare.
 */
export const ALL_POST_INCLUDES = [
  'tags',
  'authors',
  'authors.roles',
  'post_revisions',
  'post_revisions.author',
].join(',');

/** Every post/page request asks for both content formats. */
export const POST_FORMATS = 'mobiledoc,lexical';

export interface PostCreateOptions {
  /** Convert an HTML payload to lexical content. */
  source?: 'html';
}

export interface PageWriteOptions extends PostCreateOptions {
  /** Force the server to store a post revision (explicit save, leaving the editor). */
  saveRevision?: boolean;
  /** Ask the server to convert the record's mobiledoc content to lexical. */
  convertToLexical?: boolean;
}

export type PostWriteOptions = PageWriteOptions;

export function buildPostReadParams(): Record<string, string> {
  return { formats: POST_FORMATS };
}

/** Editor reads additionally need revision history and its author relation. */
export function buildPostEditorReadParams(): Record<string, string> {
  return { formats: POST_FORMATS, include: ALL_POST_INCLUDES };
}

/** Query params for post create/update requests. */
export function buildPostWriteParams(options: PostWriteOptions = {}): Record<string, string> {
  const params: Record<string, string> = { formats: POST_FORMATS };

  if (options.source) {
    params.source = options.source;
  }

  if (options.saveRevision) {
    params.save_revision = 'true';
  }

  if (options.convertToLexical) {
    params.convert_to_lexical = 'true';
  }

  params.include = ALL_POST_INCLUDES;

  return params;
}

/** Query params for page create/update requests. */
export function buildPageWriteParams(options: PageWriteOptions = {}): Record<string, string> {
  const params: Record<string, string> = { formats: POST_FORMATS };

  if (options.source) {
    params.source = options.source;
  }

  if (options.saveRevision) {
    params.save_revision = 'true';
  }

  if (options.convertToLexical) {
    params.convert_to_lexical = 'true';
  }

  params.include = ALL_POST_INCLUDES;

  return params;
}

// Read-only/virtual fields the API must not receive back on writes
const READ_ONLY_POST_FIELDS = [
  'author_id',
  'uuid',
  'url',
  'post_revisions',
  // deprecated single-author field, replaced by `authors`
  'author',
] as const;

/**
 * Shape an editable post/page into the exact payload the API expects: strips
 * read-only and virtual fields.
 */
export function serializePostPayload(
  data: object,
  resource: 'post' | 'page' = 'post',
): Record<string, unknown> {
  const json: Record<string, unknown> = { ...data };

  for (const field of READ_ONLY_POST_FIELDS) {
    delete json[field];
  }

  if (resource === 'post') {
    delete json.show_title_and_feature_image;
  }

  return json;
}
