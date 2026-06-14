import { useEffect, useMemo, useState } from 'react';
import { QueueStatusBadge } from '@/components/QueueStatusBadge';
import { useBookings } from '@/lib/bookingsStore';
import { ageFromBirth } from '@/lib/format';
import { MOCK_USERS } from '@/lib/mockData';
import {
  appointmentStatusLabel,
  serviceTypeLabel,
  type Appointment,
  type AppointmentStatus,
} from '@/lib/types';

type Filter = 'pending_or_waiting' | 'all' | 'checked_in_only' | 'completed_only';

const FILTER_LABEL: Record<Filter, string> = {
  pending_or_waiting: 'รอเช็กอิน + รอเรียก',
  all: 'ทั้งหมด',
  checked_in_only: 'เฉพาะเช็กอินแล้ว',
  completed_only: 'เฉพาะเสร็จสิ้น',
};

function ageFor(appt: Appointment): number | null {
  const u = MOCK_USERS.find((u) => u.id === appt.userId);
  if (!u) return null;
  return ageFromBirth(u.birthDate);
}

function nextStatus(s: AppointmentStatus): AppointmentStatus | null {
  if (s === 'confirmed') return 'checked_in';
  if (s === 'checked_in') return 'in_progress';
  if (s === 'in_progress') return 'completed';
  return null;
}

function actionLabelFor(s: AppointmentStatus): string {
  if (s === 'confirmed') return 'ยืนยันมาถึง';
  if (s === 'checked_in') return 'เรียก';
  if (s === 'in_progress') return 'เสร็จสิ้น';
  return '—';
}

export function QueueView() {
  const { adminQueueToday, updateStatus } = useBookings();
  const [filter, setFilter] = useState<Filter>('pending_or_waiting');
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const queue = adminQueueToday();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue.filter((a) => {
      if (filter === 'all') {
        // ok
      } else if (filter === 'pending_or_waiting') {
        if (!['confirmed', 'checked_in'].includes(a.status)) return false;
      } else if (filter === 'checked_in_only') {
        if (a.status !== 'checked_in' && a.status !== 'in_progress') return false;
      } else if (filter === 'completed_only') {
        if (a.status !== 'completed') return false;
      }
      if (q) {
        const hay = `${a.userFullName} ${a.bookingRef} ${a.queueNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [queue, filter, search]);

  const current = queue.find((a) => a.status === 'in_progress');
  const stats = {
    total: queue.length,
    checkedIn: queue.filter((a) =>
      ['checked_in', 'in_progress', 'completed'].includes(a.status),
    ).length,
    waiting: queue.filter((a) => a.status === 'checked_in').length,
    done: queue.filter((a) => a.status === 'completed').length,
  };

  function callNext() {
    const next = queue.find((a) => a.status === 'checked_in');
    if (next) updateStatus(next.id, 'in_progress');
  }

  function advance(a: Appointment) {
    const ns = nextStatus(a.status);
    if (ns) updateStatus(a.id, ns);
  }

  function markNoShow(a: Appointment) {
    updateStatus(a.id, 'no_show');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-12">
      <h1 className="text-2xl font-bold mb-4">
        จัดการคิวคลินิกอายุรกรรม — วันนี้
      </h1>

      {current ? (
        <div className="bg-white border-2 border-gray-900 p-5 mb-5 grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-5 items-center">
          <div className="bg-gov-primary text-white border-2 border-gov-primary-dark py-4 px-5 text-center">
            <span className="block text-[3.4rem] font-bold leading-none tracking-wider">
              {current.queueNumber}
            </span>
            <span className="block text-[0.7rem] font-normal tracking-widest opacity-85 mt-1">
              กำลังเรียก
            </span>
          </div>
          <div>
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1">
              <dt className="text-gray-500">ผู้รับบริการ</dt>
              <dd>
                {current.userFullName}
                {ageFor(current) !== null && ` · ${ageFor(current)} ปี`}
              </dd>
              <dt className="text-gray-500">นัดเวลา</dt>
              <dd>{current.startTime} น.</dd>
              <dt className="text-gray-500">สาเหตุ</dt>
              <dd>{current.reason || serviceTypeLabel[current.purpose]}</dd>
              <dt className="text-gray-500">หมายเลขจอง</dt>
              <dd className="font-mono">{current.bookingRef}</dd>
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => advance(current)}
              className="px-4 py-2.5 font-semibold text-white bg-gov-primary border border-gov-primary-dark hover:bg-gov-primary-dark"
            >
              เสร็จสิ้นการตรวจ
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gov-border p-5 mb-5 text-gray-500">
          ยังไม่มีคิวที่กำลังตรวจอยู่ — กดปุ่ม "เรียกคิวถัดไป" เพื่อเริ่ม
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gov-border border border-gov-border mb-5">
        <Cell label="นัดหมายทั้งหมดวันนี้" value={stats.total} />
        <Cell
          label="เช็กอินแล้ว"
          value={stats.checkedIn}
          sub={
            stats.total
              ? `${Math.round((stats.checkedIn / stats.total) * 100)}% ของนัดทั้งหมด`
              : ''
          }
        />
        <Cell
          label="รอเรียก"
          value={stats.waiting}
          sub="รอเฉลี่ย 34 นาที"
        />
        <Cell
          label="ตรวจเสร็จแล้ว"
          value={stats.done}
          sub="เฉลี่ย 12 นาที/คน"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-gray-100 border border-gov-border">
        <label htmlFor="show" className="text-sm font-semibold">
          แสดง:
        </label>
        <select
          id="show"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="px-2 py-1 border border-gray-900 bg-white text-sm"
        >
          {(Object.keys(FILTER_LABEL) as Filter[]).map((k) => (
            <option key={k} value={k}>
              {FILTER_LABEL[k]}
            </option>
          ))}
        </select>
        <label htmlFor="search-staff" className="text-sm font-semibold">
          ค้นหา:
        </label>
        <input
          id="search-staff"
          type="search"
          placeholder="ชื่อ / เลขจอง / เลขคิว"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 border border-gray-900 bg-white text-sm min-w-[200px]"
        />
        <span className="flex-1" />
        <span className="text-xs text-gray-500">
          อัปเดต {tick * 5}s ที่แล้ว
        </span>
        <button
          type="button"
          onClick={callNext}
          className="px-3 py-1.5 text-sm font-semibold text-gov-ink bg-white border-2 border-gray-900 hover:bg-gray-100"
        >
          เรียกคิวถัดไป
        </button>
      </div>

      <table
        className="w-full text-[0.95rem] border-collapse bg-white"
        aria-label="คิวคลินิกอายุรกรรมวันนี้"
      >
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-900">
            <th className="text-left p-2 font-semibold text-sm">คิว</th>
            <th className="text-left p-2 font-semibold text-sm">นัด</th>
            <th className="text-left p-2 font-semibold text-sm">เช็กอิน</th>
            <th className="text-left p-2 font-semibold text-sm">ผู้รับบริการ</th>
            <th className="text-left p-2 font-semibold text-sm">อายุ</th>
            <th className="text-left p-2 font-semibold text-sm">วัตถุประสงค์</th>
            <th className="text-left p-2 font-semibold text-sm">สถานะ</th>
            <th className="text-left p-2 font-semibold text-sm">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => {
            const age = ageFor(a);
            const next = nextStatus(a.status);
            const checkedInTime = a.checkedInAt
              ? a.checkedInAt.slice(11, 16)
              : '—';
            return (
              <tr
                key={a.id}
                className="border-b border-gov-border hover:bg-gov-primary-tint"
              >
                <td className="p-2 font-bold text-base">{a.queueNumber}</td>
                <td className="p-2">{a.startTime}</td>
                <td className="p-2">{checkedInTime}</td>
                <td className="p-2">{a.userFullName}</td>
                <td className="p-2">{age ?? '—'}</td>
                <td className="p-2">{a.reason || serviceTypeLabel[a.purpose]}</td>
                <td className="p-2">
                  <QueueStatusBadge status={a.status} />
                </td>
                <td className="p-2 whitespace-nowrap">
                  {next && (
                    <button
                      type="button"
                      onClick={() => advance(a)}
                      className="px-2 py-1 text-xs text-white bg-gov-primary border border-gov-primary-dark hover:bg-gov-primary-dark"
                    >
                      {actionLabelFor(a.status)}
                    </button>
                  )}{' '}
                  {(a.status === 'confirmed' || a.status === 'checked_in') && (
                    <button
                      type="button"
                      onClick={() => markNoShow(a)}
                      className="px-2 py-1 text-xs border border-gray-900 bg-white hover:bg-gray-100"
                    >
                      ไม่มา
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-500">
                ไม่มีรายการที่ตรงกับตัวกรอง
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex flex-wrap gap-3 text-sm items-center px-4 py-2 bg-gray-100 border border-gov-border border-t-0">
        <strong className="text-gov-ink">คำอธิบายสถานะ:</strong>
        {(
          [
            'confirmed',
            'checked_in',
            'in_progress',
            'completed',
            'no_show',
          ] as AppointmentStatus[]
        ).map((s) => (
          <QueueStatusBadge key={s} status={s} detail={appointmentStatusLabel[s]} />
        ))}
        <span className="flex-1" />
        <span className="text-gray-500">
          แสดง {filtered.length} จาก {queue.length} รายการ
        </span>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white p-4">
      <span className="text-xs text-gray-500 block">{label}</span>
      <span className="text-2xl font-bold leading-tight block mt-1">{value}</span>
      {sub && <span className="text-xs text-gray-500 block mt-1">{sub}</span>}
    </div>
  );
}
