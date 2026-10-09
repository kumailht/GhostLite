import {
  type AdminRouteHandle,
  type RouteObject,
  lazyComponent,
  matchRoutes,
  useLocation,
} from '@tryghost/admin-x-framework';

import MyProfileRedirect from './my-profile-redirect';

import HomeRedirect from './home-redirect';
import { lazyEditorScreen, lazyRestoreScreen } from './editor/api';
import { type AccessRouteHandle } from './route-access';
import { RouteAccessGuard } from './route-access-guard';
import { lazyPagesListRoute, lazyPostsListRoute } from './posts/api';
import { canAccessSettingsRoute, lazySettingsScreen, settingsRouteChildren } from './settings/api';
import { lazyTagDetailScreen, lazyTagsScreen } from './tags/api';
import { lazyViewSiteScreen } from './view-site/api';
import { canManageTags } from '@tryghost/admin-x-framework/api/users';

import { NotFound } from './shared/not-found';
import { authRoutes } from './auth/api';

const appRoutes: RouteObject[] = [
  {
    path: '/',
    Component: HomeRedirect,
  },
  {
    path: '/tags',
    handle: { requiresAccess: canManageTags } satisfies AccessRouteHandle,
    lazy: lazyComponent(lazyTagsScreen),
  },
  {
    // Covers both edit (`:tagSlug`) and create (the sentinel `new`) —
    // Ember's router declared `/tags/new` before `/tags/:tag_slug`, so a
    // tag with the literal slug "new" was already unreachable.
    path: '/tags/:tagSlug',
    handle: { requiresAccess: canManageTags } satisfies AccessRouteHandle,
    lazy: lazyComponent(lazyTagDetailScreen),
  },
  {
    path: 'my-profile',
    Component: MyProfileRedirect,
  },
  {
    // The shell swaps its primary navigation for Settings on desktop before
    // the lazy settings chunk has resolved. Mobile keeps its full takeover.
    path: `settings`,
    lazy: lazyComponent(lazySettingsScreen),
    children: settingsRouteChildren,
    handle: {
      settingsSidebar: true,
      requiresAccess: canAccessSettingsRoute,
    } satisfies AdminRouteHandle & AccessRouteHandle,
  },
  { path: '/posts', lazy: lazyComponent(lazyPostsListRoute) },
  { path: '/pages', lazy: lazyComponent(lazyPagesListRoute) },
  {
    // The editor is a focused writing surface and hides the nav sidebar.
    path: '/editor/*',
    lazy: lazyComponent(lazyEditorScreen),
    handle: { hideAdminSidebar: true } satisfies AdminRouteHandle,
  },
  { path: '/site', lazy: lazyComponent(lazyViewSiteScreen) },
  { path: '/restore', lazy: lazyComponent(lazyRestoreScreen) },
  {
    // 404 catch-all
    path: '*',
    Component: NotFound,
  },
];

export const routes: RouteObject[] = [
  // Outside the guards: signed-out visitors have no user or settings to check.
  ...authRoutes,
  {
    // RouteAccessGuard redirects to the default view on routes whose
    // handle.requiresAccess rule the current user's role fails.
    element: <RouteAccessGuard />,
    children: appRoutes,
  },
];

/** The matched route's path pattern, e.g. `/tags/:tagSlug`, never the path's own ids or slugs. */
function matchedRoutePattern(pathname: string): string {
  let pattern = '';
  for (const { route } of matchRoutes(routes, pathname) ?? []) {
    if (route.path) {
      // An absolute child path already repeats its parents' paths
      pattern = route.path.startsWith('/') ? route.path : `${pattern}/${route.path}`;
    }
  }
  return pattern.replace(/\/\/+/g, '/') || '/';
}

/** The route pattern currently showing. */
export function useRoutePattern(): string {
  const { pathname } = useLocation();
  return matchedRoutePattern(pathname);
}
