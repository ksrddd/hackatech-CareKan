import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

// Role-agnostic guard: any logged-in user passes.
// Used by the API key request page which any authenticated citizen may reach.
export function AuthRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center">กำลังโหลด…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
