import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { maskNationalId } from '@/lib/format';
import { GovLogo } from './GovLogo';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `py-1 border-b-[3px] transition-colors text-gov-ink ${
    isActive
      ? 'border-gov-primary font-semibold'
      : 'border-transparent hover:border-gov-primary'
  }`;

export function CitizenHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gov-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <GovLogo />

        {isAuthenticated ? (
          <>
            <nav className="ml-auto flex gap-5 text-sm">
              <NavLink to="/my-appointments" className={navClass}>
                นัดหมายของฉัน
              </NavLink>
              <NavLink to="/search" className={navClass}>
                ค้นหาโรงพยาบาล
              </NavLink>
              <NavLink to="/book" className={navClass}>
                จองคิวใหม่
              </NavLink>
            </nav>
            <div className="text-sm bg-gray-100 border border-gov-border px-3 py-1 flex items-center gap-2">
              <strong className="font-semibold">{user?.fullName}</strong>
              <span className="text-gray-500 text-xs">
                {user ? maskNationalId(user.nationalId) : ''}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-blue-800 hover:underline"
              >
                ออกจากระบบ
              </button>
            </div>
          </>
        ) : (
          <>
            <nav className="ml-auto flex gap-5 text-sm">
              <NavLink to="/" end className={navClass}>
                หน้าหลัก
              </NavLink>
              <NavLink to="/search" className={navClass}>
                ค้นหาโรงพยาบาล
              </NavLink>
            </nav>
            <div className="flex gap-2">
              <NavLink
                to="/login"
                className="px-3 py-1.5 text-sm border border-gov-primary text-gov-primary font-semibold hover:bg-gov-primary-tint"
              >
                เข้าสู่ระบบ
              </NavLink>
              <NavLink
                to="/register"
                className="px-3 py-1.5 text-sm bg-gov-primary text-white font-semibold border border-gov-primary-dark hover:bg-gov-primary-dark"
              >
                สมัครใช้งาน
              </NavLink>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
