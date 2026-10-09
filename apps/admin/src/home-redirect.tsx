import { Navigate } from '@tryghost/admin-x-framework';
import { useCurrentUser } from '@tryghost/admin-x-framework/api/current-user';

const HomeRedirect = () => {
  const { data: currentUser } = useCurrentUser();

  if (!currentUser) {
    return null;
  }

  return <Navigate to="/posts" crossApp replace />;
};

export default HomeRedirect;
