import { type RouteObject, Navigate, lazyComponent } from '@tryghost/admin-x-framework';

// The child routes under `settings`. The shell (apps/admin/src/routes.tsx)
// mounts these under the `settings` route node, whose element renders the
// settings providers and chrome — routed dialogs render through its Outlet.
// Paths mirror the legacy modal-route contract exactly; route ranking (static
// over dynamic over splat) resolves overlaps. `handle.dialogGroup` marks
// sibling routes rendered by one dialog instance (the staff tabs), so the
// history guard treats moving between them as a tab switch rather than leaving
// the dialog; containers that swap child components per route (design/theme)
// stay ungrouped.
/** Sibling routes with the same group are rendered by one dialog instance. */
export type SettingsRouteHandle = { dialogGroup?: string };

export const settingsRouteChildren: RouteObject[] = [
  // Design and theme share one container across four entry paths; it reads
  // the path to pick its internal view.
  {
    path: 'design/change-theme',
    lazy: lazyComponent(() => import('./site/design-and-theme-modal')),
  },
  { path: 'design/edit', lazy: lazyComponent(() => import('./site/design-and-theme-modal')) },
  { path: 'theme/install', lazy: lazyComponent(() => import('./site/design-and-theme-modal')) },
  {
    path: 'theme/edit/:themeName',
    lazy: lazyComponent(() => import('./site/design-and-theme-modal')),
  },
  // Theme names may contain %2F; anything deeper than one segment is not a
  // valid editor URL.
  { path: 'theme/edit/*', element: <Navigate to="/settings/theme" replace /> },
  { path: 'navigation/edit', lazy: lazyComponent(() => import('./site/navigation-modal')) },
  {
    path: 'staff/:slug',
    handle: { dialogGroup: 'staff' } satisfies SettingsRouteHandle,
    lazy: lazyComponent(() => import('./general/user-detail-modal')),
  },
  {
    path: 'staff/:slug/edit',
    handle: { dialogGroup: 'staff' } satisfies SettingsRouteHandle,
    lazy: lazyComponent(() => import('./general/user-detail-modal')),
  },
  {
    path: 'staff/:slug/social-links',
    handle: { dialogGroup: 'staff' } satisfies SettingsRouteHandle,
    lazy: lazyComponent(() => import('./general/user-detail-modal')),
  },
  {
    path: 'staff/:slug/email-notifications',
    handle: { dialogGroup: 'staff' } satisfies SettingsRouteHandle,
    lazy: lazyComponent(() => import('./general/user-detail-modal')),
  },
  { path: 'history/view/:userId?', lazy: lazyComponent(() => import('./advanced/history-modal')) },
  { path: 'about', lazy: lazyComponent(() => import('./general/about')) },
  // The lock-site setting lives in the Site access section.
  { path: 'locksite', element: <Navigate to="/settings/site-access" replace /> },
  // Section anchors (/settings/<navid>) and unknown paths render the shell
  // alone; the shell scrolls to the section.
  { path: '*', element: null },
  { index: true, element: null },
];
