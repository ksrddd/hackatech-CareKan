import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface LocationState {
  from?: string;
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center">กำลังโหลด…</div>;
  }

  if (isAuthenticated) {
    const state = location.state as LocationState | null;
    const target =
      state?.from && state.from !== '/login' && state.from !== '/register'
        ? state.from
        : '/my-appointments';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
