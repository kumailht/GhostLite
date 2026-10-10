import { formatPostTime } from '@/posts/list/post-time';
import type { PostListItem } from '@/posts/list/hooks/use-posts-list';

/**
 * Every string a post row renders, as pure functions.
 *
 * Ported from `apps/ember-admin/app/components/posts-list/list-item-analytics.hbs`
 * and its helpers. Kept out of the component because this is where parity
 * actually lives — the wording and the conditions behind it are far easier to
 * get subtly wrong than the layout, and far harder to eyeball.
 */

type PostStatus = 'draft' | 'scheduled' | 'published' | 'sent';

function statusOf(post: PostListItem): PostStatus {
  return post.status ?? 'draft';
}

/** Comma-joined author names, falling back to the email for un-named staff. */
export function getPostAuthorNames(post: PostListItem): string {
  return (post.authors ?? [])
    .map((author) => author.name || author.email)
    .filter(Boolean)
    .join(', ');
}

/**
 * Drafts and scheduled posts have no meaningful publish date, so the list
 * shows when they were last touched instead.
 */
export function getPostDateField(post: PostListItem): 'updated_at' | 'published_at' {
  const status = statusOf(post);

  return status === 'draft' || status === 'scheduled' ? 'updated_at' : 'published_at';
}

export function getPostDate(post: PostListItem): string | undefined {
  return (
    (getPostDateField(post) === 'updated_at' ? post.updated_at : post.published_at) ?? undefined
  );
}

export interface PostMetaLine {
  /** "By Ada, Grace" — null when the post has no authors at all. */
  byline: string | null;
  primaryTagName: string | null;
}

export function getPostMetaLine(post: PostListItem): PostMetaLine {
  const authors = getPostAuthorNames(post);

  return {
    byline: authors ? `By ${authors}` : null,
    primaryTagName: post.primary_tag?.name ?? null,
  };
}

/**
 * The meta line as separable parts, so the row can join them without emitting
 * a dangling separator — a post with no authors would otherwise read
 * " – 13 Jul 2026".
 */
export function getPostMetaParts(
  post: PostListItem,
  { timezone, now }: PostStatusDetailOptions = {},
): string[] {
  const { byline, primaryTagName } = getPostMetaLine(post);
  const date = getPostDate(post);

  return [
    byline,
    primaryTagName ? `in ${primaryTagName}` : null,
    date ? formatPostTime(date, { timezone, absolute: true, short: true, now }) : null,
  ].filter((part): part is string => Boolean(part));
}

/** Ember prefixes the date's title attribute so it has context. */
export function getPostDateTooltip(
  post: PostListItem,
  { timezone, now }: PostStatusDetailOptions = {},
): string | undefined {
  const date = getPostDate(post);

  if (!date) {
    return undefined;
  }

  const prefix = getPostDateField(post) === 'updated_at' ? 'Updated' : 'Published';

  return `${prefix} ${formatPostTime(date, { timezone, absolute: true, now })}`;
}

/** The always-visible status text. */
export function getPostStatusLabel(post: PostListItem): string {
  switch (statusOf(post)) {
    case 'scheduled':
      return 'Scheduled';
    // GhostLite never emails posts; an imported "sent" post reads as published.
    case 'published':
    case 'sent':
      return 'Published';
    default:
      return 'Draft';
  }
}

export interface PostStatusDetailOptions {
  timezone?: string;
  now?: Date;
}

/**
 * The extra text Ember reveals on hover: when a scheduled post will go out.
 * `null` when there is nothing to add.
 */
export function getPostStatusDetail(
  post: PostListItem,
  { timezone, now }: PostStatusDetailOptions = {},
): string | null {
  const status = statusOf(post);

  if (status === 'scheduled') {
    // Joined rather than interpolated: a post with no publish date yields
    // an empty `when`, which interpolation would leave as a double space.
    const when = formatPostTime(post.published_at, { timezone, scheduled: true, now });

    return ['to be published', when].filter(Boolean).join(' ');
  }

  return null;
}
