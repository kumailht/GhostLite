import type { ReactNode } from 'react';

import ThemeErrorsBanner from '@/layout/app-sidebar/theme-errors-banner';
import { useAdminSidebarVisibility } from '@/layout/sidebar-visibility';

import { useActiveThemeErrors } from './use-theme-errors';

export interface SidebarBannerState {
  bannerType: 'theme-errors' | null;
  banner: ReactNode;
  hasBanner: boolean;
}

export function useSidebarBannerState(): SidebarBannerState {
  const { hasErrors } = useActiveThemeErrors();
  const sidebarVisible = useAdminSidebarVisibility();

  if (sidebarVisible && hasErrors) {
    return {
      bannerType: 'theme-errors',
      banner: <ThemeErrorsBanner />,
      hasBanner: true,
    };
  }

  return {
    bannerType: null,
    banner: null,
    hasBanner: false,
  };
}
