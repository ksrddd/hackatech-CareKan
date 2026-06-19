import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { maskNationalId } from '@/lib/format';
import { GovLogo } from './GovLogo';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `py-1 border-b-[3px] transition-colors text-gov-ink whitespace-nowrap ${
    isActive
      ? 'border-gov-primary font-semibold'
      : 'border-transparent hover:border-gov-primary'
  }`;

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 text-sm border-b border-gov-border transition-colors ${
    isActive
      ? 'bg-gov-primary-tint text-gov-primary font-semibold border-l-4 border-l-gov-primary'
      : 'text-gov-ink hover:bg-gray-50'
  }`;

export function CitizenHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-white border-b border-gov-border relative">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <GovLogo />

        {/* Desktop nav */}
        {isAuthenticated ? (
          <>
            <nav className="ml-auto hidden md:flex gap-5 text-sm" aria-label="เมนูหลัก">
              <NavLink to="/my-appointments" className={navClass}>
                นัดหมายของฉัน
              </NavLink>
              <NavLink to="/search" className={navClass}>
                ค้นหาโรงพยาบาล
              </NavLink>
              <NavLink to="/request-api-key" className={navClass}>
                API Key
              </NavLink>
            </nav>
            <div className="hidden md:flex text-sm bg-gray-100 border border-gov-border px-3 py-1 items-center gap-2 shrink-0">
              <Link
                to="/profile"
                className="font-semibold text-gov-ink hover:underline"
                title="ดูบัญชีของฉัน"
              >
                {user?.fullName}
              </Link>
              <span className="text-gray-500 text-xs hidden lg:inline">
                {user ? maskNationalId(user.nationalId) : ''}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-blue-800 hover:underline"
              >
                ออก
              </button>
            </div>
          </>
        ) : (
          <div className="ml-auto hidden md:flex items-center gap-5">
            <nav className="flex gap-5 text-sm" aria-label="เมนูหลัก">
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
          </div>
        )}

        {/* Hamburger button (mobile only) */}
        <button
          type="button"
          aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(v => !v)}
          className="ml-auto md:hidden flex flex-col gap-1.5 p-2 text-gov-ink"
        >
          <span className={`block w-5 h-0.5 bg-current transition-transform origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-transform origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gov-border bg-white shadow-md"
        >
          {isAuthenticated ? (
            <>
              <NavLink to="/my-appointments" className={mobileNavClass} onClick={closeMenu}>
                นัดหมายของฉัน
              </NavLink>
              <NavLink to="/search" className={mobileNavClass} onClick={closeMenu}>
                ค้นหาโรงพยาบาล
              </NavLink>
              <NavLink to="/request-api-key" className={mobileNavClass} onClick={closeMenu}>
                API Key
              </NavLink>
              <div className="px-4 py-3 border-b border-gov-border bg-gray-50 flex items-center justify-between">
                <div>
                  <Link
                    to="/profile"
                    className="font-semibold text-gov-ink hover:underline text-sm"
                    onClick={closeMenu}
                  >
                    {user?.fullName}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user ? maskNationalId(user.nationalId) : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { logout(); closeMenu(); }}
                  className="text-sm text-blue-800 hover:underline px-2 py-1"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/" end className={mobileNavClass} onClick={closeMenu}>
                หน้าหลัก
              </NavLink>
              <NavLink to="/search" className={mobileNavClass} onClick={closeMenu}>
                ค้นหาโรงพยาบาล
              </NavLink>
              <div className="px-4 py-3 flex gap-2">
                <NavLink
                  to="/login"
                  className="flex-1 py-2 text-center text-sm border border-gov-primary text-gov-primary font-semibold hover:bg-gov-primary-tint"
                  onClick={closeMenu}
                >
                  เข้าสู่ระบบ
                </NavLink>
                <NavLink
                  to="/register"
                  className="flex-1 py-2 text-center text-sm bg-gov-primary text-white font-semibold border border-gov-primary-dark hover:bg-gov-primary-dark"
                  onClick={closeMenu}
                >
                  สมัครใช้งาน
                </NavLink>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
