import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

interface ProtectedRouteProps {
  role: Role;
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/my-appointments'} replace />;
  }
  return <Outlet />;
}
