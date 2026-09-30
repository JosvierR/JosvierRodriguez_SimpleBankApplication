import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { PageLoading } from '@/shared/components/States';

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isLoading)
    return (
      <main className="route-loading">
        <PageLoading />
      </main>
    );
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
