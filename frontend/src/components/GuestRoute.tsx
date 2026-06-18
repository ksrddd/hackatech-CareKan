import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface LocationState {
  from?: string;
}

/** Inverse of ProtectedRoute: keeps already-authenticated users OUT of the
 *  guest-only pages (login, register) and sends them to their role home.
 *  Honors a `from` hint so a protected-route bounce still lands where intended. */
export function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center">กำลังโหลด…</div>;
  }

  if (isAuthenticated) {
    const state = location.state as LocationState | null;
    const home = user?.role === 'admin' ? '/admin' : '/my-appointments';
    const target =
      state?.from && state.from !== '/login' && state.from !== '/register'
        ? state.from
        : home;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
