import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminQueue } from '@/lib/adminQueue';
import { useAuth } from '@/lib/auth';
import { ADMIN_HOURLY_LOAD, CONSULT_ROOMS } from '@/lib/uiContent';
import { serviceTypeLabel } from '@/lib/types';

const ROOM_STATUS_LABEL = {
  in_use: { label: 'กำลังตรวจ', cls: 'bg-gov-wait-bg text-gov-wait-ink border-gov-wait-ink' },
  available: { label: 'ว่าง', cls: 'bg-gov-ok-bg text-gov-ok-ink border-gov-ok-ink' },
  closed: { label: 'ปิด', cls: 'bg-gray-200 text-gray-700 border-gray-400' },
};

export function AdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user!.primaryHospitalId ?? 'klang';
  const today = new Date().toISOString().slice(0, 10);
  const { state, refetch } = useAdminQueue(hospitalId, today);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRefreshTick((n) => n + 1);
      refetch();
    }, 5000);
    return () => window.clearInterval(id);
  }, [refetch]);

  const queue = state.kind === 'success' ? state.data : [];

  const total = queue.length;
  const checkedIn = queue.filter((a) =>
    ['checked_in', 'in_progress', 'completed'].includes(a.status),
  ).length;
  const inProgress = queue.filter((a) => a.status === 'in_progress').length;
  const completed = queue.filter((a) => a.status === 'completed').length;
  const noShow = queue.filter((a) => a.status === 'no_show').length;
  const pending = queue.filter((a) => a.status === 'confirmed');

  const utilization = total === 0 ? 0 : Math.round((checkedIn / total) * 100);

  // Most-recent N bookings sorted by createdAt desc
  const recent = [...queue]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 pb-12">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600 text-sm">
            ภาพรวมคิวและกิจกรรมประจำวันของคลินิก
          </p>
        </div>
        <div className="flex gap-2 text-sm items-center">
          <select className="border border-gov-border px-3 py-1.5">
            <option>คลินิกอายุรกรรม</option>
            <option disabled>คลินิกศัลยกรรม (อยู่ระหว่างพัฒนา)</option>
          </select>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-gov-ok-ink rounded-full" />
            อัปเดต {refreshTick * 5}s ที่แล้ว
          </span>
        </div>
      </div>

      <section
        aria-label="ภาพรวมตัวเลข"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5"
      >
        <Kpi label="นัดทั้งหมดวันนี้" value={total} sub="" color="text-gov-ink" />
        <Kpi
          label="เช็กอินแล้ว"
          value={checkedIn}
          sub={total ? `${Math.round((checkedIn / total) * 100)}% ของวันนี้` : ''}
          color="text-gov-ok-ink"
        />
        <Kpi
          label="กำลังตรวจ"
          value={inProgress}
          sub="ห้องตรวจกำลังใช้งาน"
          color="text-gov-wait-ink"
        />
        <Kpi
          label="เสร็จสิ้นแล้ว"
          value={completed}
          sub="เฉลี่ย 14 นาที/คน"
          color="text-green-700"
        />
        <Kpi
          label="ไม่มาตามนัด"
          value={noShow}
          sub=""
          color="text-gov-err-ink"
        />
        <Kpi label="การใช้งาน" value={`${utilization}%`} sub="" color="text-gov-primary" />
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          <section className="bg-white border border-gov-border p-5">
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-gov-border">
              <h2 className="text-lg font-semibold">
                การจองตามช่วงเวลา (วันนี้)
              </h2>
              <span className="text-xs text-gray-500">
                ความจุสูงสุด 20 คิว/ชั่วโมง
              </span>
            </div>
            <div className="grid grid-cols-8 gap-2 items-end h-44 px-2">
              {ADMIN_HOURLY_LOAD.map((slot) => {
                const pct = (slot.booked / slot.capacity) * 100;
                return (
                  <div
                    key={slot.hour}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-semibold text-gov-ink">
                      {slot.booked}
                    </span>
                    <div
                      className={`w-full ${
                        slot.current
                          ? 'bg-gov-primary-dark border-2 border-gov-yellow'
                          : 'bg-gov-primary'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    <span
                      className={`text-xs ${
                        slot.current
                          ? 'font-bold text-gov-primary'
                          : 'text-gray-500'
                      }`}
                    >
                      {slot.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-gov-border p-5">
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-gov-border">
              <h2 className="text-lg font-semibold">นัดที่จองล่าสุด</h2>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-gov-ok-ink rounded-full" />
                เรียลไทม์
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-900">
                  <th className="text-left p-2 font-semibold">หมายเลขจอง</th>
                  <th className="text-left p-2 font-semibold">ผู้ป่วย</th>
                  <th className="text-left p-2 font-semibold">นัดเวลา</th>
                  <th className="text-left p-2 font-semibold">วัตถุประสงค์</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gov-border"
                  >
                    <td className="p-2 font-mono">{r.bookingRef}</td>
                    <td className="p-2">{r.userFullName}</td>
                    <td className="p-2">{r.startTime}</td>
                    <td className="p-2">
                      {serviceTypeLabel[r.purpose]}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500 text-sm">
                      {state.kind === 'submitting' || state.kind === 'idle'
                        ? 'กำลังโหลด…'
                        : 'ยังไม่มีรายการ'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-right">
              <Link
                to="/admin/queue"
                className="text-blue-800 hover:underline"
              >
                ไปที่คิววันนี้ →
              </Link>
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="bg-white border-l-[6px] border-gov-wait-ink border border-gov-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl" aria-hidden>⚠️</span>
              <h2 className="font-semibold">ยังไม่ Check-in</h2>
              <span className="ml-auto bg-gov-wait-bg text-gov-wait-ink px-2 py-0.5 text-xs font-semibold border border-gov-wait-ink">
                {pending.length} ราย
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              มีนัดในวันนี้แต่ยังไม่เช็กอิน
            </p>
            <ul className="text-sm space-y-2">
              {pending.slice(0, 3).map((p) => (
                <li key={p.id} className="border border-gov-border p-2">
                  <div className="flex justify-between items-center">
                    <strong className="font-mono text-xs">
                      {p.bookingRef}
                    </strong>
                    <span className="text-xs text-gray-500">
                      {p.startTime} · {p.queueNumber}
                    </span>
                  </div>
                  <span className="block text-gray-600 text-xs">
                    {p.userFullName} · {serviceTypeLabel[p.purpose]}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/admin/queue"
              className="block text-center text-sm mt-3 pt-2 border-t border-gov-border text-blue-800 hover:underline"
            >
              ไปที่หน้าจัดการคิวเต็ม →
            </Link>
          </section>

          <section className="bg-white border border-gov-border p-4">
            <h2 className="font-semibold mb-3 pb-2 border-b border-gov-border">
              ห้องตรวจ
            </h2>
            <ul className="text-sm space-y-2">
              {CONSULT_ROOMS.map((r) => (
                <li
                  key={r.number}
                  className="flex justify-between items-center"
                >
                  <span>
                    ห้อง {r.number} — {r.doctor}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold border ${ROOM_STATUS_LABEL[r.status].cls}`}
                  >
                    {ROOM_STATUS_LABEL[r.status].label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className={`bg-white border-t-4 ${color.replace('text-', 'border-t-')} border border-gov-border p-3`}>
      <p className="text-xs uppercase text-gray-500 tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
