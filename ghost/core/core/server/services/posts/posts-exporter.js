const { Readable } = require('stream');

const EXPORT_BATCH_SIZE = 50;
const DEFAULT_EXPORT_LIMIT = 15;
const EXPORT_WITH_RELATED = ['tags', 'authors'];

function parseExportLimit(limit) {
  if (limit === 'all') {
    return Infinity;
  }

  if (limit === undefined || limit === null) {
    return DEFAULT_EXPORT_LIMIT;
  }

  const parsed = Number.parseInt(limit, 10);

  if (!Number.isSafeInteger(parsed)) {
    return DEFAULT_EXPORT_LIMIT;
  }

  return Math.max(parsed, 1);
}

function hasIdOrder(order) {
  return String(order)
    .split(',')
    .map((orderPart) => orderPart.trim().toLowerCase())
    .some((orderPart) => {
      const [field] = orderPart.split(/\s+/);
      return field === 'id' || field === 'posts.id';
    });
}

function withStableExportOrder(order) {
  if (!order || hasIdOrder(order)) {
    return order;
  }

  return `${order}, id desc`;
}

class PostsExporter {
  #models;
  #getPostUrl;

  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.models
   * @param {Object} dependencies.models.Post
   * @param {Object} dependencies.getPostUrl
   */
  constructor({ models, getPostUrl }) {
    this.#models = models;
    this.#getPostUrl = getPostUrl;
  }

  /**
   * @param {object} options
   * @param {string} [options.filter]
   * @param {string} [options.order]
   * @param {string|number} [options.limit]
   * @returns {Promise<Readable>}
   */
  async export({ filter, order, limit, mongoTransformer }) {
    const requestedLimit = parseExportLimit(limit);
    const pageLimit = Math.min(EXPORT_BATCH_SIZE, requestedLimit);

    return Readable.from(
      this.#streamPosts({
        filter,
        order: withStableExportOrder(order),
        requestedLimit,
        pageLimit,
        mongoTransformer,
      }),
      { objectMode: true },
    );
  }

  /**
   * @param {object} options
   * @param {string} [options.filter]
   * @param {string} [options.order]
   * @param {number} options.requestedLimit - Infinity means unbounded
   * @param {number} options.pageLimit
   * @returns {AsyncGenerator<object>}
   */
  async *#streamPosts({ filter, order, requestedLimit, pageLimit, mongoTransformer }) {
    let emitted = 0;

    for (let page = 1; emitted < requestedLimit; page++) {
      const posts = await this.#models.Post.findPage({
        filter: filter ?? 'status:published',
        order,
        limit: pageLimit,
        page,
        skipPagination: true,
        withRelated: EXPORT_WITH_RELATED,
        mongoTransformer,
      });

      if (posts.data.length === 0) {
        break;
      }

      const remaining = requestedLimit - emitted;
      const batch = posts.data.slice(0, remaining);
      const mapped = batch.map((post) => this.#mapPost(post));
      emitted += mapped.length;
      yield* mapped;

      if (posts.data.length < pageLimit) {
        break;
      }
    }
  }

  #mapPost(post) {
    const published = post.get('status') !== 'draft' && post.get('status') !== 'scheduled';

    return {
      id: post.get('id'),
      title: post.get('title'),
      url: this.#getPostUrl(post),
      author: post
        .related('authors')
        .map((author) => author.get('name'))
        .join(', '),
      status: post.get('status'),
      created_at: post.get('created_at'),
      updated_at: post.get('updated_at'),
      published_at: published ? post.get('published_at') : null,
      featured: post.get('featured'),
      tags: post
        .related('tags')
        .map((tag) => tag.get('name'))
        .join(', '),
    };
  }
}

module.exports = PostsExporter;
