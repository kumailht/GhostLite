// Framework
export type { TopLevelFrameworkProps } from './providers/framework-provider';
export {
  FrameworkProvider,
  defaultUnsplashConfig,
  useFramework,
} from './providers/framework-provider';

// Hooks
export { useConfirmUnload } from './hooks/use-confirm-unload';
export { default as useForm } from './hooks/use-form';
export type { Dirtyable, ErrorMessages, OkProps, SaveHandler, SaveState } from './hooks/use-form';
export { default as useHandleError } from './hooks/use-handle-error';
export { default as useFilterableApi } from './hooks/use-filterable-api';
export { useKoenigFileUpload, koenigFileUploadTypes } from './hooks/use-koenig-file-upload';
export { useKoenigFetchEmbed } from './hooks/use-koenig-fetch-embed';

// API status
export { onUpgradeStatus } from './utils/api/upgrade-status';
export type { UpgradeStatus } from './utils/api/upgrade-status';

// Post utilities
export type { Post } from './api/posts';
export { focusKoenigEditorOnBottomClick } from './utils/focus-koenig-editor-on-bottom-click';

// Routing
export type { RouteObject } from 'react-router';
export type { NavigateOptions } from './providers/router-provider';
export type AdminRouteHandle = {
  allowInForceUpgrade?: boolean;
  hideAdminSidebar?: boolean;
  settingsSidebar?: boolean;
};
export {
  RouterProvider,
  useNavigate,
  useRouteHasParams,
  resetScrollPosition,
  ScrollRestoration,
  Navigate,
} from './providers/router-provider';
export { useNavigationStack } from './providers/navigation-stack-provider';
export {
  Link,
  NavigationType,
  Outlet,
  useBlocker,
  useLocation,
  useParams,
  useRouteError,
  useSearchParams,
  redirect,
  matchRoutes,
  useMatch,
  useMatches,
} from 'react-router';
export type { BlockerFunction } from 'react-router';

// Lazy component loader
export { lazyComponent } from './utils/lazy-component';

// Data fetching
export type { InfiniteData } from '@tanstack/react-query';
export { useQueryClient } from '@tanstack/react-query';
