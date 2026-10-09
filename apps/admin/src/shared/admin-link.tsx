import { Link } from '@tryghost/admin-x-framework';
import { forwardRef } from 'react';

type AdminLinkProps = Omit<React.ComponentProps<'a'>, 'href'> & {
  /** In-app path, e.g. `/tags/news` or `/posts?type=draft` */
  to: string;
  state?: unknown;
};

// Goes through the router so the entry carries router state for the history blockers.
export const AdminLink = forwardRef<HTMLAnchorElement, AdminLinkProps>(function AdminLink(
  { to, state, children, ...props },
  ref,
) {
  return (
    <Link ref={ref} state={state} to={to} {...props}>
      {children}
    </Link>
  );
});
