import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QueueStatusBadge } from '@/components/QueueStatusBadge';
import { useAuth } from '@/lib/auth';
import { useMyAppointments } from '@/lib/appointments';
import { useHospitals } from '@/lib/hospitals';
import {
  ageFromBirth,
  buddhistYear,
  formatBuddhistDateShort,
  formatThaiWeekday,
  formatTimeRange,
  maskNationalId,
  nowFormatted,
} from '@/lib/format';
import type { Appointment, AppointmentStatus } from '@/lib/types';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconClock({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 4.5V8l2.5 2" />
    </svg>
  );
}

function IconBuilding({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14V6l6-4 6 4v8H2z" />
      <path d="M6 14v-4h4v4" />
    </svg>
  );
}


function IconCalendarEmpty({ className = '' }: { className?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"
      className={`mx-auto ${className}`}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="8" width="32" height="28" rx="2" />
      <path d="M4 16h32M12 4v8M28 4v8" />
      <path d="M13 24h4M23 24h4M13 30h4" strokeWidth="2" />
    </svg>
  );
}

function IconChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left'
        ? <path d="M10 3L5 8l5 5" />
        : <path d="M6 3l5 5-5 5" />}
    </svg>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

const statusAccent: Record<AppointmentStatus, string> = {
  pending:     'border-l-gov-wait-ink',
  confirmed:   'border-l-gov-primary',
  checked_in:  'border-l-gov-primary',
  in_progress: 'border-l-gov-primary',
  completed:   'border-l-gov-ok-ink',
  cancelled:   'border-l-gray-300',
  no_show:     'border-l-gov-err-ink',
};

function dotColorClass(status: AppointmentStatus): string {
  if (['pending', 'confirmed', 'checked_in', 'in_progress'].includes(status))
    return 'bg-gov-primary';
  if (status === 'completed') return 'bg-gov-ok-ink';
  return 'bg-gray-400';
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface CalCell {
  iso: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildCells(year: number, month: number): CalCell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const cells: CalCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(0, 0, 0, 0);
    cells.push({
      iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: d.getTime() === todayMidnight.getTime(),
    });
  }
  return cells;
}

interface CalendarProps {
  appointments: Appointment[];
  hospitalNames: Map<string, string>;
}

function AppointmentCalendar({ appointments, hospitalNames }: CalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const apptMap = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const list = m.get(a.date) ?? [];
      list.push(a);
      m.set(a.date, list);
    }
    return m;
  }, [appointments]);

  const cells = useMemo(() => buildCells(viewYear, viewMonth), [viewYear, viewMonth]);

  function prevMonth() {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const baseDate = new Date(viewYear, viewMonth, 1);
  const selectedAppts = selectedDate ? (apptMap.get(selectedDate) ?? []) : [];

  return (
    <>
      {/* Header — same style as DateGrid */}
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-gray-100 border border-gov-border mb-3">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="เดือนก่อนหน้า"
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <IconChevron dir="left" />
        </button>
        <strong className="text-base">{THAI_MONTHS[viewMonth]} {buddhistYear(baseDate)}</strong>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="เดือนถัดไป"
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <IconChevron dir="right" />
        </button>
        <span className="flex-1" />
        <span className="text-sm text-gray-500 flex gap-3 items-center flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gov-primary inline-block" />
            นัดที่จะมาถึง
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gov-ok-ink inline-block" />
            เสร็จสิ้น
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
            ยกเลิก
          </span>
        </span>
      </div>

      {/* Grid — same wrapper as DateGrid */}
      <div
        role="grid"
        aria-label={`ปฏิทินนัดหมาย ${THAI_MONTHS[viewMonth]} ${buddhistYear(baseDate)}`}
        className="grid grid-cols-7 border border-gov-border bg-white"
      >
        {/* Day-of-week headers */}
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="bg-gray-100 text-center p-2 font-semibold text-sm border-r border-b border-gov-border last:border-r-0"
          >
            {wd}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => {
          const dayAppts = apptMap.get(cell.iso) ?? [];
          const isSelected = cell.iso === selectedDate;
          const hasAppt = dayAppts.length > 0;
          const sideBorder = (i + 1) % 7 === 0 ? '' : 'border-r';
          const base = 'min-h-[70px] flex flex-col justify-between p-2 text-center text-sm border-b border-gov-border';

          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.iso + i}
                role="gridcell"
                className={`${base} ${sideBorder} bg-gray-50`}
              />
            );
          }

          return (
            <button
              key={cell.iso + i}
              type="button"
              role="gridcell"
              onClick={() => hasAppt && setSelectedDate(cell.iso === selectedDate ? null : cell.iso)}
              disabled={!hasAppt}
              aria-pressed={isSelected}
              aria-label={`${cell.day} ${THAI_MONTHS[viewMonth]}${cell.isToday ? ' (วันนี้)' : ''}${hasAppt ? ` มี ${dayAppts.length} นัด` : ''}`}
              className={[
                base, sideBorder, 'transition-colors',
                isSelected ? 'bg-gov-primary text-white font-semibold' : '',
                !isSelected && hasAppt ? 'hover:bg-gov-primary-tint cursor-pointer' : '',
                !hasAppt ? 'cursor-default' : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Day number */}
              <span className={[
                'font-semibold',
                cell.isToday && !isSelected ? 'underline decoration-2 decoration-gov-primary text-gov-primary' : '',
                !cell.isToday && !isSelected && !hasAppt ? 'text-gray-400' : '',
              ].filter(Boolean).join(' ')}>
                {cell.day}
              </span>

              {/* Bottom slot: dots if has appts, else empty */}
              <div className="flex gap-0.5 justify-center min-h-[10px]">
                {dayAppts.slice(0, 3).map((a, di) => (
                  <span
                    key={di}
                    className={`w-2 h-2 rounded-full inline-block ${isSelected ? 'bg-white opacity-80' : dotColorClass(a.status)}`}
                  />
                ))}
                {dayAppts.length > 3 && (
                  <span className={`text-[9px] leading-none ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                    +{dayAppts.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected date detail panel */}
      {selectedDate && (
        <div className="border border-t-0 border-gov-border bg-gov-primary-tint px-4 py-3">
          <p className="text-xs font-semibold text-gov-primary uppercase tracking-wider mb-2">
            {(() => {
              const [y, m, d] = selectedDate.split('-').map(Number) as [number, number, number];
              return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
            })()}
            <span className="ml-2 font-normal text-gray-500 normal-case tracking-normal">
              — {selectedAppts.length} นัดหมาย
            </span>
          </p>
          <ul className="space-y-2">
            {selectedAppts.map(a => (
              <li key={a.id}>
                <Link
                  to={`/appointments/${a.id}`}
                  className="flex items-start gap-2.5 bg-white border border-gov-border px-3 py-2.5 hover:bg-gov-primary-tint transition-colors"
                >
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dotColorClass(a.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gov-ink leading-snug">
                      {a.startTime} – {a.endTime} น.
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {hospitalNames.get(a.hospitalId) ?? a.hospitalId}
                      <span className="mx-1.5 text-gray-300" aria-hidden="true">·</span>
                      คิว {a.queueNumber}
                    </p>
                  </div>
                  <QueueStatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white border border-gov-border border-l-4 border-l-gray-200 p-4 space-y-2.5" aria-hidden="true">
      <div className="flex justify-between items-start">
        <div className="h-4 bg-gray-200 rounded w-36" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-28" />
      <div className="h-3 bg-gray-200 rounded w-52" />
      <div className="h-3 bg-gray-200 rounded w-40" />
    </div>
  );
}

function SkeletonCalendar() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gov-border mb-3">
        <div className="w-7 h-7 bg-gray-300 rounded" />
        <div className="h-5 bg-gray-300 rounded w-36" />
      </div>
      <div className="grid grid-cols-7 border border-gov-border bg-white">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 p-2 border-r border-b border-gov-border last:border-r-0 h-10" />
        ))}
        {Array(42).fill(0).map((_, i) => (
          <div
            key={i}
            className={`min-h-[70px] p-2 border-b border-gov-border bg-gray-50 ${(i + 1) % 7 !== 0 ? 'border-r' : ''}`}
          >
            <div className="w-6 h-4 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────

interface AppointmentCardProps {
  a: Appointment;
  hospName: string;
  muted?: boolean;
}

function AppointmentCard({ a, hospName, muted }: AppointmentCardProps) {
  return (
    <Link
      to={`/appointments/${a.id}`}
      className={`block bg-white border border-gov-border border-l-4 ${statusAccent[a.status]} p-4 hover:bg-gov-primary-tint transition-colors ${muted ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="font-bold text-gov-ink">{formatBuddhistDateShort(a.date)}</span>
          <span className="text-gray-400 text-sm ml-2">{formatThaiWeekday(a.date)}</span>
        </div>
        <QueueStatusBadge status={a.status} />
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
        <IconClock className="text-gray-400" />
        <span>{formatTimeRange(a.startTime, a.endTime)} น.</span>
        <span className="mx-1 text-gray-300" aria-hidden="true">·</span>
        <span className="font-semibold text-gov-ink">คิว {a.queueNumber}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-0.5">
        <IconBuilding className="text-gray-400" />
        <span className="font-medium">{hospName}</span>
      </div>
    </Link>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, count, loading }: { title: string; count: number; loading: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {!loading && (
        <span className="text-xs text-gray-400 bg-gray-100 border border-gov-border px-1.5 py-0.5 leading-none">
          {count}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MyAppointments() {
  const { user } = useAuth();
  const { state } = useMyAppointments();
  const { state: hospitalsState } = useHospitals({});

  if (!user) return null;

  const hospitalNames = new Map<string, string>();
  if (hospitalsState.kind === 'success') {
    for (const h of hospitalsState.data) hospitalNames.set(h.id, h.shortName);
  }

  const isLoading = state.kind === 'idle' || state.kind === 'submitting';
  const upcoming  = state.kind === 'success' ? state.data.upcoming : [];
  const history   = state.kind === 'success' ? state.data.history  : [];
  const allAppts  = [...upcoming, ...history];
  const next      = upcoming[0];
  const nextHospName = next ? (hospitalNames.get(next.hospitalId) ?? next.hospitalId) : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-16">

      {/* Breadcrumb */}
      <p className="text-sm text-gray-500 mb-4">
        <Link to="/" className="text-blue-800 hover:underline">หน้าหลัก</Link>
        {' '}<span aria-hidden="true">›</span>{' '}นัดหมายของฉัน
      </p>

      {/* Title + greeting */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-5">
        <h1 className="text-2xl font-bold text-gov-ink">นัดหมายของฉัน</h1>
        <span className="text-sm text-gray-500">คุณ{user.fullName} · {nowFormatted()}</span>
      </div>

      {/* Error */}
      {state.kind === 'error' && (
        <div role="alert" className="mb-5 px-4 py-3 border border-gov-err-ink bg-gov-err-bg text-gov-err-ink text-sm">
          เกิดข้อผิดพลาด: {state.error.message}
        </div>
      )}

      {/* Next appointment hero */}
      {!isLoading && next && nextHospName && (
        <div className="mb-6 border border-gov-primary bg-gov-primary-tint">
          <div className="px-4 py-2 bg-gov-primary">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">นัดหมายถัดไป</span>
          </div>
          <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gov-ink leading-tight">{formatBuddhistDateShort(next.date)}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                <IconClock className="text-gray-400" />
                {formatThaiWeekday(next.date)} · {formatTimeRange(next.startTime, next.endTime)} น.
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                <IconBuilding className="text-gray-400" />
                <span className="font-medium truncate">{nextHospName}</span>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-gray-500 mb-0.5">หมายเลขคิว</p>
              <p className="text-4xl font-bold text-gov-primary tracking-tight">{next.queueNumber}</p>
              <p className="text-xs text-gray-500 mt-1">แสดงที่จุดประชาสัมพันธ์</p>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">

        {/* Main column */}
        <div className="space-y-6 min-w-0">

          {/* Calendar */}
          <section aria-label="ปฏิทินนัดหมาย">
            {isLoading
              ? <SkeletonCalendar />
              : <AppointmentCalendar appointments={allAppts} hospitalNames={hospitalNames} />
            }
          </section>

          {/* Upcoming */}
          <section aria-labelledby="upcoming-heading">
            <SectionHeader title="นัดหมายที่กำลังจะมาถึง" count={upcoming.length} loading={isLoading} />
            {isLoading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            ) : upcoming.length === 0 ? (
              <div className="bg-white border border-gov-border py-10 px-4 text-center">
                <IconCalendarEmpty className="text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">ยังไม่มีนัดหมายที่กำลังจะมาถึง</p>
                <Link to="/search" className="text-sm font-semibold text-blue-800 hover:underline">
                  ค้นหาโรงพยาบาลเพื่อจองคิว →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(a => (
                  <AppointmentCard key={a.id} a={a} hospName={hospitalNames.get(a.hospitalId) ?? a.hospitalId} />
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section aria-labelledby="history-heading">
            <SectionHeader title="ประวัติการนัดหมาย" count={history.length} loading={isLoading} />
            {isLoading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">ยังไม่มีประวัติการนัดหมาย</p>
            ) : (
              <div className="space-y-3">
                {history.map(a => (
                  <AppointmentCard key={a.id} a={a} hospName={hospitalNames.get(a.hospitalId) ?? a.hospitalId} muted />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 text-sm">
          <div className="bg-white border border-gov-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">ทำรายการด่วน</h3>
            <Link to="/book" className="block text-center px-4 py-2.5 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark mb-2">
              จองคิวใหม่
            </Link>
            <Link to="/search" className="block text-center px-4 py-2.5 font-semibold text-gov-ink bg-white border-2 border-gray-300 hover:bg-gray-50">
              ค้นหาโรงพยาบาล
            </Link>
          </div>

          <div className="bg-white border border-gov-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">ผู้รับบริการ</h3>
            <p className="font-semibold text-gov-ink leading-snug">{user.fullName}</p>
            <p className="text-gray-500 text-xs mt-1">
              เกิด {formatBuddhistDateShort(user.birthDate)} · อายุ {ageFromBirth(user.birthDate)} ปี
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              เลข ปชช.&nbsp;{maskNationalId(user.nationalId)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
