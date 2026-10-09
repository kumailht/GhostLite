/**
 * Public surface of the posts domain, consumed by the admin shell
 * (apps/admin/src/routes.tsx). Everything else in this domain is internal.
 */
export { POST_VIEW_PARAMS } from './list/post-view-params';
export { getPostListReturnUrl, getStickyPostFilterUrl } from './list/posts-sticky-filters';
export type { PostResource } from './list/post-resource';
export { PublishPhaseIcon } from './email-sending-status/publish-phase-icon';

// Lazy route entries keep the posts and pages list chunks out of the shell
// while still exposing them through the domain boundary.
export const lazyPostsListRoute = () => import('./list/posts-route');
export const lazyPagesListRoute = () => import('./list/pages-route');
