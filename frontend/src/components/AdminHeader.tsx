import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { GovLogo } from './GovLogo';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `py-1 border-b-[3px] transition-colors text-gov-ink ${
    isActive
      ? 'border-gov-primary font-semibold'
      : 'border-transparent hover:border-gov-primary'
  }`;

export function AdminHeader() {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gov-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <GovLogo
          to="/admin"
          title="ระบบจัดการคิวคลินิก"
          subtitle="Clinic Queue Management — Staff Console"
        />
        <nav className="ml-auto flex gap-5 text-sm">
          <NavLink to="/admin" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/queue" className={navClass}>
            คิววันนี้
          </NavLink>
        </nav>
        {user && (
          <div className="text-sm bg-gray-100 border border-gov-border px-3 py-1">
            <strong className="font-semibold">{user.fullName}</strong>{' '}
            <span className="text-gray-500 text-xs">ห้อง 207</span>
          </div>
        )}
      </div>
    </header>
  );
}
