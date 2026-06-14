import { Link } from 'react-router-dom';
import { QueueStatusBadge } from '@/components/QueueStatusBadge';
import { useAuth } from '@/lib/auth';
import { useBookings } from '@/lib/bookingsStore';
import {
  ageFromBirth,
  formatBuddhistDateShort,
  formatThaiWeekday,
  formatTimeRange,
  isPastDate,
  maskNationalId,
  nowFormatted,
} from '@/lib/format';
import { getHospital } from '@/lib/mockData';
import {
  clinicLabel,
  insuranceRightLabel,
} from '@/lib/types';

export function MyAppointments() {
  const { user } = useAuth();
  const { myBookings } = useBookings();
  if (!user) return null;

  const all = myBookings(user.id);
  const upcoming = all
    .filter((a) => !isPastDate(a.date) && a.status !== 'cancelled')
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    );
  const history = all
    .filter((a) => isPastDate(a.date) || a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled')
    .sort((a, b) => b.date.localeCompare(a.date));

  const next = upcoming[0];
  const nextHospital = next ? getHospital(next.hospitalId) : undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        › นัดหมายของฉัน
      </p>
      <h1 className="text-2xl font-bold mb-1">นัดหมายของฉัน</h1>
      <p className="text-gray-600 mb-5">
        สวัสดี คุณ{user.fullName} · เข้าใช้งานล่าสุด {nowFormatted()}
      </p>

      {next && nextHospital && (
        <div className="border-l-[6px] border-gov-primary bg-gov-primary-tint px-4 py-3 text-[0.95rem] mb-5">
          <strong className="block">
            นัดถัดไป: {formatBuddhistDateShort(next.date)} เวลา {next.startTime} น.
          </strong>
          {clinicLabel[next.clinic]} {nextHospital.shortName} —
          แสดงหมายเลขคิว {next.queueNumber} ที่จุดประชาสัมพันธ์เพื่อรับบัตรคิว
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          <section className="bg-white border border-gov-border p-5 mb-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              นัดหมายที่กำลังจะมาถึง{' '}
              <span className="text-sm text-gray-500 font-normal">
                ({upcoming.length} รายการ)
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                ยังไม่มีนัดหมาย —{' '}
                <Link
                  to="/search"
                  className="text-blue-800 hover:underline font-semibold"
                >
                  เริ่มจองคิวเลย →
                </Link>
              </div>
            ) : (
              <table
                className="w-full text-[0.95rem] border-collapse"
                aria-label="ตารางนัดหมายที่กำลังจะมาถึง"
              >
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-900">
                    <th className="text-left p-2 font-semibold text-sm">
                      วันที่ / เวลา
                    </th>
                    <th className="text-left p-2 font-semibold text-sm">
                      โรงพยาบาล / คลินิก
                    </th>
                    <th className="text-left p-2 font-semibold text-sm">เลขคิว</th>
                    <th className="text-left p-2 font-semibold text-sm">สถานะ</th>
                    <th className="text-left p-2 font-semibold text-sm">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((a) => {
                    const hosp = getHospital(a.hospitalId);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-gov-border hover:bg-gov-primary-tint"
                      >
                        <td className="p-2 align-middle">
                          <strong>{formatBuddhistDateShort(a.date)}</strong>
                          <br />
                          <span className="text-gray-500 text-sm">
                            {formatThaiWeekday(a.date)} ·{' '}
                            {formatTimeRange(a.startTime, a.endTime)}
                          </span>
                        </td>
                        <td className="p-2 align-middle">
                          <strong>{hosp?.shortName ?? a.hospitalId}</strong>
                          <br />
                          <span className="text-gray-500 text-sm">
                            {clinicLabel[a.clinic]}
                          </span>
                        </td>
                        <td className="p-2 align-middle font-bold text-base">
                          {a.queueNumber}
                        </td>
                        <td className="p-2 align-middle">
                          <QueueStatusBadge status={a.status} />
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-sm">
                          <Link
                            to={`/appointments/${a.id}`}
                            className="text-blue-800 hover:underline"
                          >
                            รายละเอียด
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="bg-white border border-gov-border p-5 mb-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              ประวัติการนัดหมาย{' '}
              <span className="text-sm text-gray-500 font-normal">
                ({history.length} รายการ)
              </span>
            </h2>
            {history.length === 0 ? (
              <p className="py-4 text-center text-gray-500">
                ยังไม่มีประวัติการนัดหมาย
              </p>
            ) : (
              <table className="w-full text-[0.95rem] border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-900">
                    <th className="text-left p-2 font-semibold text-sm">วันที่</th>
                    <th className="text-left p-2 font-semibold text-sm">
                      คลินิก
                    </th>
                    <th className="text-left p-2 font-semibold text-sm">
                      โรงพยาบาล
                    </th>
                    <th className="text-left p-2 font-semibold text-sm">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => {
                    const hosp = getHospital(a.hospitalId);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-gov-border hover:bg-gov-primary-tint"
                      >
                        <td className="p-2">{formatBuddhistDateShort(a.date)}</td>
                        <td className="p-2">{clinicLabel[a.clinic]}</td>
                        <td className="p-2">{hosp?.shortName}</td>
                        <td className="p-2">
                          <QueueStatusBadge status={a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-gov-border p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              ทำรายการด่วน
            </h3>
            <Link
              to="/book"
              className="block text-center px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark mb-2"
            >
              จองคิวใหม่
            </Link>
            <Link
              to="/search"
              className="block text-center px-5 py-3 font-semibold text-gov-ink bg-white border-2 border-gray-900 hover:bg-gray-100"
            >
              ค้นหาโรงพยาบาล
            </Link>
          </div>

          <div className="bg-white border border-gov-border p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              ข้อมูลผู้รับบริการ
            </h3>
            <p>
              <strong>{user.fullName}</strong>
              <br />
              <span className="text-sm text-gray-500">
                เกิด {formatBuddhistDateShort(user.birthDate)} ·{' '}
                {ageFromBirth(user.birthDate)} ปี
              </span>
            </p>
            <p className="text-sm text-gray-500">
              เลข ปชช. {maskNationalId(user.nationalId)}
            </p>
            <hr className="my-3 border-gov-border" />
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              สิทธิการรักษา
            </h3>
            <p>{insuranceRightLabel[user.insuranceRight]}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
