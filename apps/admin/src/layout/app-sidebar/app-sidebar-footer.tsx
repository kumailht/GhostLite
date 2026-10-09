import React from 'react';

import {
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from '@tryghost/shade/components';
import { UserMenu } from './user-menu';
import { useSidebarBannerState } from './hooks/use-sidebar-banner-state';

function AppSidebarFooter({ ...props }: React.ComponentProps<typeof SidebarFooter>) {
  const { hasBanner } = useSidebarBannerState();

  return (
    <>
      <SidebarFooter {...props}>
        <SidebarGroup className={hasBanner ? 'pt-3' : ''}>
          <SidebarMenu>
            <SidebarMenuItem>
              <UserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </>
  );
}

export default AppSidebarFooter;
