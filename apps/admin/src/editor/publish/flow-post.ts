import type { PostStatus } from '@tryghost/admin-x-framework/api/posts';
import type { EditorSaveSnapshot } from '@/editor/session/snapshot';
import type { EditorRecord } from '@/editor/session/projection';

/**
 * What the publish flow needs from the post being published. A projection, not
 * the API record: the flow reads it and never writes to it.
 */
export interface PublishFlowPost {
  id: string;
  /** 'post' or 'page' — Ember's `displayName`, used verbatim in copy. */
  displayName: 'post' | 'page';
  status: PostStatus;
  title: string;
  excerpt?: string | null;
  /** The post's front-end URL, for the complete step's bookmark. */
  url?: string | null;
  featureImage?: string | null;
  publishedAt?: string | null;
  /** The version of the server's copy, absent until there is one. */
  updatedAt?: string | null;
}

export function isPage(post: PublishFlowPost): boolean {
  return post.displayName === 'page';
}

export interface PublishFlowPostSources {
  /** The engine's view of the post: identity, status, publish time and the live title. */
  snapshot: Pick<EditorSaveSnapshot, 'id' | 'status' | 'title' | 'publishedAt'>;
  /** The record the session is loaded at; absent until a created post has been read back. */
  record?: EditorRecord;
  displayName: 'post' | 'page';
}

/**
 * Projects the post the editor holds into the publish flow's input. Status,
 * publish time and title come from the engine, so they do not wait for a save
 * to be read back; everything else needs the server's copy and is left out
 * until there is one.
 */
export function buildPublishFlowPost({
  snapshot,
  record,
  displayName,
}: PublishFlowPostSources): PublishFlowPost {
  return {
    id: snapshot.id ?? record?.id ?? '',
    displayName,
    status: snapshot.status,
    title: snapshot.title,
    excerpt: record?.custom_excerpt ?? null,
    url: record?.url ?? null,
    featureImage: record?.feature_image ?? null,
    publishedAt: snapshot.publishedAt,
    updatedAt: record?.updated_at ?? null,
  };
}
