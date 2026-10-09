import { useCallback, useEffect } from 'react';
import {
  type AdminRouteHandle,
  type RouteObject,
  lazyComponent,
  matchRoutes,
  useLocation,
} from '@tryghost/admin-x-framework';

import MyProfileRedirect from './my-profile-redirect';

// Ember
import { syncEmberRoutePattern } from './ember-bridge';
import HomeRedirect from './home-redirect';
import { EditorGate } from './editor-gate';
import { lazyRestoreScreen } from './editor/api';
import { useFlagGatedRouteOwner } from './use-flag-gated-route-owner';
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
    // Served by React or Ember depending on the `editorReact` Labs flag.
    //
    // The editor is a focused writing surface and has always hidden the nav
    // sidebar. Ember arranges that by setting `ui.isFullScreen` when the
    // editor route *activates* — but the Ember posts route aborts its
    // transition to hand off to React, so the editor route never deactivates,
    // and a second visit is a model change on an already-active route where
    // `activate()` does not run again. The sidebar came back from the second
    // post onwards. Deciding it from the route handle makes React the
    // authority, removes the cross-implementation handshake, and applies to
    // both sides of the `editorReact` flag.
    path: '/editor/*',
    Component: EditorGate,
    handle: { hideAdminSidebar: true } satisfies AdminRouteHandle,
  },
  { path: '/site', lazy: lazyComponent(lazyViewSiteScreen) },
  { path: '/restore', lazy: lazyComponent(lazyRestoreScreen) },
  {
    // 404 catch-all for routes not handled by React or Ember
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

// Ember's router only learns about a URL change from `hashchange`, which the
// React router's pushState navigation does not fire, so links into Ember-owned
// routes must stay native hash anchors. Everything else can be a router link
// (and so gets router history state, which the unsaved-changes blockers need).
/** Decides for any path whether Ember owns it, for destinations only known at event time. */
export function useEmberOwnedRouteMatcher(): (pathname: string) => boolean {
  const editorOwner = useFlagGatedRouteOwner('editorReact');

  return useCallback(
    (pathname: string) => {
      const leaf = matchRoutes(routes, pathname)?.at(-1)?.route;
      if (!leaf) {
        return true;
      }
      if (leaf.Component === EditorGate) {
        return editorOwner !== 'react';
      }
      return false;
    },
    [editorOwner],
  );
}

export function useIsEmberOwnedRoute(pathname: string): boolean {
  return useEmberOwnedRouteMatcher()(pathname);
}

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

/** The route pattern React is showing, or null while Ember serves the screen. */
export function useRoutePattern(): string | null {
  const { pathname } = useLocation();
  const isEmberOwned = useIsEmberOwnedRoute(pathname);
  return isEmberOwned ? null : matchedRoutePattern(pathname);
}

/** Tells Ember which route pattern React is showing, or null while Ember serves the screen. */
export function useSyncEmberRoutePattern(): void {
  const routePattern = useRoutePattern();

  useEffect(() => syncEmberRoutePattern(routePattern), [routePattern]);
}
