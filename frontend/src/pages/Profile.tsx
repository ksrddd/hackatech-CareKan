import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  ageFromBirth,
  formatBuddhistDate,
  maskNationalId,
} from '@/lib/format';
import { type Sex } from '@/lib/types';

const sexLabel: Record<Sex, string> = {
  male: 'ชาย',
  female: 'หญิง',
  unspecified: 'ไม่ระบุ',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gov-primary pb-2 mb-1 border-b-2 border-gov-primary">
      {children}
    </h2>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-0 py-3 border-b border-gov-border last:border-0">
      <dt className="text-xs text-gray-400 uppercase tracking-wide sm:w-40 shrink-0">{label}</dt>
      <dd className={`font-medium text-gov-ink ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

const NAV_LINKS = [
  {
    to: '/my-appointments',
    label: 'นัดหมายของฉัน',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1"/>
        <path d="M5 1v4M11 1v4M2 7h12"/>
      </svg>
    ),
  },
  {
    to: '/book',
    label: 'จองคิวใหม่',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3v10M3 8h10"/>
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'ค้นหาโรงพยาบาล',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="4"/>
        <path d="M14 14l-3-3"/>
      </svg>
    ),
  },
  {
    to: '/request-api-key',
    label: 'ขอ API Key',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="9" r="3.5"/>
        <path d="M9 6.5l5.5-5.5M12.5 1.5l2 2M10.5 3.5l2 2"/>
      </svg>
    ),
  },
];

export function Profile() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const age = ageFromBirth(user.birthDate);
  const initials = user.fullName.trim().charAt(0) || '?';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-4">
        <Link to="/" className="text-blue-800 hover:underline">หน้าหลัก</Link>
        {' '}› บัญชีของฉัน
      </p>

      {/* ── Hero card ── */}
      <section className="bg-white border-2 border-gov-ink mb-5 overflow-hidden">
        <div className="h-1.5 bg-gov-primary" />
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="w-20 h-20 shrink-0 grid place-items-center bg-gov-primary text-white font-bold text-4xl border-2 border-gov-primary-dark select-none">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gov-ink leading-tight mb-1">
              {user.fullName}
            </h1>
            <p className="text-sm font-mono text-gray-500 mb-0.5">
              {maskNationalId(user.nationalId)}
            </p>
            <p className="text-xs text-gray-400">
              สมาชิกตั้งแต่ {formatBuddhistDate(user.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="self-start sm:self-center shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gov-err-ink border-2 border-gov-err-ink bg-white hover:bg-gov-err-bg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3"/>
              <path d="M11 11l3-3-3-3M14 8H6"/>
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_220px] gap-5">
        {/* ── Main column ── */}
        <div className="space-y-5">

          <section className="bg-white border border-gov-border p-5">
            <SectionTitle>ข้อมูลส่วนตัว</SectionTitle>
            <dl>
              <InfoRow label="ชื่อ–นามสกุล" value={user.fullName} />
              <InfoRow label="เลข ปชช." value={maskNationalId(user.nationalId)} mono />
              <InfoRow label="วัน เดือน ปีเกิด" value={formatBuddhistDate(user.birthDate)} />
              <InfoRow label="อายุ" value={`${age} ปี`} />
              <InfoRow label="เพศ" value={sexLabel[user.sex]} />
            </dl>
          </section>

          <section className="bg-white border border-gov-border p-5">
            <SectionTitle>ข้อมูลติดต่อ</SectionTitle>
            <dl>
              <InfoRow label="เบอร์โทรศัพท์" value={user.phone} />
              <InfoRow label="อีเมล" value={user.email} />
            </dl>
          </section>

          <section className="bg-white border border-gov-border p-5">
            <SectionTitle>ข้อมูลบัญชี</SectionTitle>
            <dl>
              <InfoRow label="สมัครเมื่อ" value={formatBuddhistDate(user.createdAt)} />
              <InfoRow
                label="ยินยอม PDPA"
                value={user.consentAt ? formatBuddhistDate(user.consentAt) : 'ยังไม่ได้ให้ความยินยอม'}
              />
            </dl>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gov-border leading-relaxed">
              หากต้องการแก้ไขข้อมูลส่วนตัว เช่น เบอร์โทร อีเมล
              กรุณาติดต่อเจ้าหน้าที่ของโรงพยาบาล
            </p>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <section className="bg-white border border-gov-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 pb-2 mb-3 border-b border-gov-border">
              เมนูด่วน
            </h3>
            <nav>
              {NAV_LINKS.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gov-ink hover:bg-gov-primary-tint hover:text-gov-primary border-b border-gov-border last:border-0 transition-colors"
                >
                  <span className="text-gov-primary shrink-0">{icon}</span>
                  {label}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-gray-300" aria-hidden="true"><path d="M4 2l4 4-4 4"/></svg>
                </Link>
              ))}
            </nav>
          </section>

          <section className="bg-gov-primary-tint border border-gov-border p-4">
            <div className="flex items-start gap-2.5">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1b4d8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5"/>
                <path d="M8 7v5M8 5v.5"/>
              </svg>
              <p className="text-xs text-gov-ink leading-relaxed">
                ข้อมูลของคุณถูกเก็บรักษาตามนโยบาย PDPA และใช้เพื่อการจองคิวเท่านั้น
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
