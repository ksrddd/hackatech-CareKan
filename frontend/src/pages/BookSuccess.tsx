import { Link, Navigate, useParams } from 'react-router-dom';
import { QrStub } from '@/components/QrStub';
import { useAuth } from '@/lib/auth';
import { useBookings } from '@/lib/bookingsStore';
import {
  formatBuddhistDate,
  formatTimeRange,
  maskNationalId,
} from '@/lib/format';
import { getHospital } from '@/lib/mockData';
import {
  clinicLabel,
  insuranceRightLabel,
  serviceTypeLabel,
} from '@/lib/types';

export function BookSuccess() {
  const { id } = useParams<{ id: string }>();
  const { getBooking } = useBookings();
  const { user } = useAuth();

  if (!id) return <Navigate to="/my-appointments" replace />;
  if (!user) return <Navigate to="/login" replace />;
  const appt = getBooking(id, { requireOwnerUserId: user.id });
  if (!appt) return <Navigate to="/my-appointments" replace />;

  const hospital = getHospital(appt.hospitalId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-12">
      <ol className="flex items-center justify-between mb-6 text-sm">
        {['โรงพยาบาล', 'วันและเวลา', 'ยืนยัน', 'สำเร็จ'].map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            <span className="w-6 h-6 grid place-items-center bg-gov-ok-ink text-white text-xs border border-gov-ok-ink">
              ✓
            </span>
            <span
              className={`text-gov-ok-ink ${
                i === 3 ? 'font-semibold' : ''
              }`}
            >
              {label}
            </span>
            {i < 3 && <span className="flex-1 h-[2px] bg-gov-ok-ink mx-2" />}
          </li>
        ))}
      </ol>

      <section className="bg-gov-ok-bg border-2 border-gov-ok-ink p-5 mb-5 text-center">
        <div className="w-14 h-14 mx-auto mb-2 grid place-items-center bg-gov-ok-ink text-white text-3xl font-bold border-2 border-gov-ok-ink">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-1 text-gov-ok-ink">จองคิวสำเร็จ!</h1>
        <p className="text-gov-ok-ink">
          ระบบได้บันทึกการนัดหมายของคุณเรียบร้อยแล้ว
        </p>
      </section>

      <section className="bg-white border-2 border-gov-ink p-5 mb-5">
        <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-center">
          <QrStub />
          <dl className="text-[0.95rem] grid grid-cols-[110px_1fr] gap-y-2">
            <dt className="font-semibold">หมายเลขจอง</dt>
            <dd className="font-mono">{appt.bookingRef}</dd>
            <dt className="font-semibold">หมายเลขคิว</dt>
            <dd className="text-3xl font-bold text-gov-primary">
              {appt.queueNumber}
            </dd>
            <dt className="font-semibold">โรงพยาบาล</dt>
            <dd>{hospital?.shortName ?? appt.hospitalId}</dd>
            <dt className="font-semibold">คลินิก</dt>
            <dd>{clinicLabel[appt.clinic]}</dd>
            <dt className="font-semibold">วันที่</dt>
            <dd>{formatBuddhistDate(appt.date)}</dd>
            <dt className="font-semibold">เวลา</dt>
            <dd>{formatTimeRange(appt.startTime, appt.endTime)}</dd>
            <dt className="font-semibold">วัตถุประสงค์</dt>
            <dd>{serviceTypeLabel[appt.purpose]}</dd>
            {user && (
              <>
                <dt className="font-semibold">ผู้รับบริการ</dt>
                <dd>
                  {user.fullName}
                  <span className="text-sm text-gray-500">
                    {' '}
                    ({maskNationalId(user.nationalId)})
                  </span>
                </dd>
                <dt className="font-semibold">สิทธิ</dt>
                <dd>{insuranceRightLabel[user.insuranceRight]}</dd>
              </>
            )}
          </dl>
        </div>
      </section>

      <section className="bg-white border border-gov-border p-5 mb-5">
        <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
          📋 ก่อนไปอย่าลืม
        </h2>
        <ul className="space-y-2 text-[0.95rem]">
          <li className="flex gap-3">
            <input type="checkbox" /> <span>บัตรประจำตัวประชาชน</span>
          </li>
          <li className="flex gap-3">
            <input type="checkbox" />{' '}
            <span>บัตรประจำตัวผู้ป่วยของโรงพยาบาล (ถ้ามี)</span>
          </li>
          <li className="flex gap-3">
            <input type="checkbox" /> <span>ผลตรวจครั้งก่อน (ถ้ามี)</span>
          </li>
          <li className="flex gap-3">
            <input type="checkbox" />{' '}
            <span>รายการยาที่ทานอยู่ในปัจจุบัน</span>
          </li>
          <li className="flex gap-3">
            <input type="checkbox" /> <span>หน้ากากอนามัย</span>
          </li>
        </ul>
      </section>

      <section className="bg-gov-primary-tint border-l-[6px] border-gov-primary p-4 mb-5 text-[0.95rem]">
        <strong className="block mb-2">วันนัดหมายควรทำอย่างไร</strong>
        <ol className="list-decimal pl-5 space-y-1">
          <li>มาถึง รพ. ก่อนเวลานัด 30 นาที</li>
          <li>เปิดหน้านัดหมายของคุณ แสดงหมายเลขจอง/คิวที่ประชาสัมพันธ์</li>
          <li>รับบัตรคิวจริงและรอเรียกตามลำดับ</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3 justify-center no-print">
        <Link
          to={`/appointments/${appt.id}`}
          className="px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
        >
          ดูสถานะนัดหมาย
        </Link>
        <Link
          to="/my-appointments"
          className="px-5 py-3 font-semibold text-gov-primary bg-white border-2 border-gov-primary hover:bg-gov-primary-tint"
        >
          กลับหน้านัดของฉัน
        </Link>
      </div>
    </div>
  );
}
