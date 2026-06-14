import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { AdminHeader } from './AdminHeader';
import { GovBar } from './GovBar';
import { GovFooter } from './GovFooter';
import { SkipLink } from './SkipLink';

function AdminRightBar() {
  const { logout } = useAuth();
  return (
    <>
      <span>
        วันนี้ ·{' '}
        <strong>
          {new Date().toLocaleTimeString('th-TH', { hour12: false })}
        </strong>
      </span>
      <button
        type="button"
        onClick={logout}
        className="text-gov-yellow hover:underline"
      >
        ออกจากระบบ
      </button>
    </>
  );
}

export function AdminLayout() {
  return (
    <>
      <SkipLink />
      <GovBar variant="admin" right={<AdminRightBar />} />
      <AdminHeader />
      <main id="main">
        <Outlet />
      </main>
      <GovFooter variant="admin" />
    </>
  );
}
