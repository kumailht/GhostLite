import React from 'react';

import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { useCurrentUser } from '@tryghost/admin-x-framework/api/current-user';
import { canManageTags } from '@tryghost/admin-x-framework/api/users';
import { NavMenuItem } from './nav-menu-item';
import { useNavigationExpanded } from './hooks/use-navigation-preferences';
import { NavSavedViews } from './nav-saved-views';
import { usePostNavigation } from './use-post-navigation';

function PostsNavItemContent({ isActive, to }: { isActive: boolean; to: string }) {
  return (
    <>
      <NavMenuItem.Link isActive={isActive} to={to}>
        <LucideIcon.PenLine className="pointer-events-none opacity-0 transition-all sidebar:opacity-100 sidebar:group-hover/menu-item:opacity-0 sidebar:group-has-[button:focus-visible]/menu-item:opacity-0" />
        <NavMenuItem.Label>Posts</NavMenuItem.Label>
      </NavMenuItem.Link>
      <a
        aria-label="Create new post"
        className="absolute top-0 right-0 flex size-8 items-center justify-center rounded-full p-0 text-gray-700 ring-sidebar-ring outline-hidden transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 dark:text-gray-800 dark:hover:text-white"
        href="#/editor/post"
      >
        <LucideIcon.Plus className="mt-px stroke-[1.5px]!" size={20} />
      </a>
    </>
  );
}

function NavContent({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const { data: currentUser } = useCurrentUser();
  const [savedPostsExpanded, setPostsExpanded] = useNavigationExpanded('posts');
  const postNavigation = usePostNavigation('posts');
  const pageNavigation = usePostNavigation('pages');

  const showTags = currentUser && canManageTags(currentUser);
  const postViews = [...postNavigation.defaultViews, ...postNavigation.customViews];
  const hasActivePostChild = postViews.some((view) => view.isActive);
  const postsExpanded = savedPostsExpanded;
  const postsRoute = postNavigation.mainUrl;
  const postsNavActive = postNavigation.isMainActive || (!postsExpanded && hasActivePostChild);
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <NavMenuItem.Collapsible
            expanded={postsExpanded}
            id="posts-submenu"
            onExpandedChange={setPostsExpanded}
          >
            <NavMenuItem.CollapsibleItem ariaLabel="Toggle post views">
              <PostsNavItemContent isActive={postsNavActive} to={postsRoute} />
            </NavMenuItem.CollapsibleItem>

            <NavMenuItem.CollapsibleMenu>
              <NavSavedViews views={postViews} />
            </NavMenuItem.CollapsibleMenu>
          </NavMenuItem.Collapsible>

          <NavMenuItem>
            <NavMenuItem.Link isActive={pageNavigation.isMainActive} to={pageNavigation.mainUrl}>
              <LucideIcon.File />
              <NavMenuItem.Label>Pages</NavMenuItem.Label>
            </NavMenuItem.Link>
          </NavMenuItem>

          {showTags && (
            <NavMenuItem>
              <NavMenuItem.Link to="tags" activeOnSubpath>
                <LucideIcon.Tag />
                <NavMenuItem.Label>Tags</NavMenuItem.Label>
              </NavMenuItem.Link>
            </NavMenuItem>
          )}

        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default NavContent;
