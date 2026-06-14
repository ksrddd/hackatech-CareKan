import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { QrStub } from '@/components/QrStub';
import { QueueStatusBadge } from '@/components/QueueStatusBadge';
import { useAuth } from '@/lib/auth';
import { useBookings } from '@/lib/bookingsStore';
import {
  formatBuddhistDate,
  formatTimeRange,
  isPastDate,
  maskNationalId,
} from '@/lib/format';
import { getHospital } from '@/lib/mockData';
import {
  clinicLabel,
  insuranceRightLabel,
  serviceTypeLabel,
} from '@/lib/types';

export function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { getBooking } = useBookings();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 5000);
    return () => window.clearInterval(t);
  }, []);

  if (!id) return <Navigate to="/my-appointments" replace />;
  if (!user) return <Navigate to="/login" replace />;
  // Ownership-scoped read: citizens can never view another patient's record,
  // even with a guessed ID. ProtectedRoute only checks role.
  const appt = getBooking(id, { requireOwnerUserId: user.id });
  if (!appt) return <Navigate to="/my-appointments" replace />;

  const hospital = getHospital(appt.hospitalId);
  const queueNumeric = Number(appt.queueNumber.slice(1));
  const beforeMe = Math.max(0, queueNumeric - 38 - (tick % 4));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/my-appointments" className="text-blue-800 hover:underline">
          นัดหมายของฉัน
        </Link>{' '}
        › รายละเอียดนัด
      </p>
      <h1 className="text-2xl font-bold mb-1">รายละเอียดนัดหมาย</h1>
      <p className="text-gray-600 mb-5">
        หมายเลขจอง <span className="font-mono">{appt.bookingRef}</span>
      </p>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5">
          <section className="bg-white border-2 border-gov-ink p-5">
            <div className="flex justify-between items-start gap-4 flex-wrap pb-3 mb-4 border-b border-gov-border">
              <div className="flex items-center gap-3">
                <img
                  src="/carekan-logo.jpg"
                  alt="CareKan"
                  width={96}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    ใบนัดหมายโรงพยาบาล
                  </h2>
                  <p className="text-sm text-gray-500 font-mono">
                    เลขที่นัด {appt.bookingRef}
                  </p>
                </div>
              </div>
              <QueueStatusBadge status={appt.status} />
            </div>

            <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-2">
              <dt className="text-gray-500">ผู้รับบริการ</dt>
              <dd className="font-medium">{appt.userFullName}</dd>
              {user && (
                <>
                  <dt className="text-gray-500">เลข ปชช.</dt>
                  <dd className="font-medium font-mono">
                    {maskNationalId(user.nationalId)}
                  </dd>
                  <dt className="text-gray-500">สิทธิการรักษา</dt>
                  <dd className="font-medium">
                    {insuranceRightLabel[user.insuranceRight]}
                  </dd>
                </>
              )}
              <dt className="text-gray-500">โรงพยาบาล</dt>
              <dd className="font-medium">
                {hospital?.shortName ?? appt.hospitalId}
              </dd>
              <dt className="text-gray-500">คลินิก</dt>
              <dd className="font-medium">{clinicLabel[appt.clinic]}</dd>
              <dt className="text-gray-500">วัตถุประสงค์</dt>
              <dd className="font-medium">{serviceTypeLabel[appt.purpose]}</dd>
              {appt.reason && (
                <>
                  <dt className="text-gray-500">เหตุผลเบื้องต้น</dt>
                  <dd className="font-medium">{appt.reason}</dd>
                </>
              )}
              <dt className="text-gray-500">วันที่นัด</dt>
              <dd>
                <strong>{formatBuddhistDate(appt.date)}</strong>
              </dd>
              <dt className="text-gray-500">ช่วงเวลา</dt>
              <dd>
                <strong>
                  {formatTimeRange(appt.startTime, appt.endTime)}
                </strong>{' '}
                <span className="text-sm text-gray-500">
                  (มาก่อนเวลานัด 30 นาที)
                </span>
              </dd>
              <dt className="text-gray-500">เลขคิว</dt>
              <dd className="text-2xl font-bold">{appt.queueNumber}</dd>
            </dl>
          </section>

          {!isPastDate(appt.date) && appt.status !== 'cancelled' && (
            <section className="bg-white border border-gov-border p-5">
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-gov-border">
                <h2 className="text-lg font-semibold">สถานะคิวสด</h2>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-gov-ok-ink rounded-full" />
                  อัปเดตเองทุก 5 วินาที
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="border-2 border-gov-primary p-4">
                  <p className="text-xs text-gray-500 mb-1">คิวปัจจุบัน</p>
                  <p className="text-3xl font-bold text-gov-primary">
                    A{String(38 + (tick % 4)).padStart(3, '0')}
                  </p>
                </div>
                <div className="border-2 border-gov-wait-ink p-4">
                  <p className="text-xs text-gray-500 mb-1">รอก่อนคุณ</p>
                  <p className="text-3xl font-bold text-gov-wait-ink">
                    {beforeMe}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    คิว · เฉลี่ย ~12 นาที/คน
                  </p>
                </div>
                <div className="border-2 border-gov-ink p-4">
                  <p className="text-xs text-gray-500 mb-1">หมายเลขคิวของคุณ</p>
                  <p className="text-3xl font-bold">{appt.queueNumber}</p>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white border border-gov-border p-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              สิ่งที่ต้องเตรียม
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>บัตรประจำตัวประชาชนตัวจริง</li>
              <li>บัตรประจำตัวผู้ป่วยของโรงพยาบาล (ถ้ามี)</li>
              <li>ยาเดิมที่กำลังรับประทาน หรือใบรับรองแพทย์จาก รพ. อื่น</li>
              <li>มาถึง รพ. ก่อนเวลานัด 30 นาที</li>
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-gov-border p-5 text-center">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
              QR ใบนัด
            </h3>
            <QrStub />
            <p className="text-xs text-gray-500 mt-2">
              แสดงที่จุดเช็กอินวันนัด
            </p>
          </div>

          {hospital && (
            <div className="bg-white border border-gov-border p-4 text-sm">
              <strong className="block mb-2 pb-2 border-b border-gov-border">
                ติดต่อ {hospital.shortName}
              </strong>
              <p className="mb-1">📞 {hospital.phone}</p>
              <p className="text-gray-500 text-xs">{hospital.address}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
