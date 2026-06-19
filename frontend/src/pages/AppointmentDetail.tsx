import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { QrStub } from '@/components/QrStub';
import { QueueStatusBadge } from '@/components/QueueStatusBadge';
import { useAuth } from '@/lib/auth';
import { useAppointment } from '@/lib/appointments';
import { useHospital } from '@/lib/hospitals';
import {
  formatBuddhistDate,
  formatTimeRange,
  isPastDate,
  maskNationalId,
} from '@/lib/format';
import {
  appointmentStatusLabel,
  serviceTypeLabel,
} from '@/lib/types';

// Inner component that receives a confirmed id and renders the detail.
// Separated so hooks are always called unconditionally.
function AppointmentDetailInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { state, refetch } = useAppointment(id);

  // 5-second live queue polling
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch hospital name once we have the hospitalId (from success state)
  const hospitalId = state.kind === 'success' ? state.data.hospitalId : '';
  const { state: hospitalState } = useHospital(hospitalId);
  const hospital =
    hospitalState.kind === 'success' ? hospitalState.data.hospital : null;

  if (!user) return <Navigate to="/login" replace />;

  if (state.kind === 'submitting') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">
        กำลังโหลด…
      </div>
    );
  }

  // PDPA owner check is server-side: a non-owner or missing id yields a 404 ApiError.
  // Render "ไม่พบนัดหมาย" without leaking any information about the record.
  if (state.kind === 'error') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-xl font-semibold text-gray-700 mb-3">ไม่พบนัดหมาย</p>
        <p className="text-gray-500 mb-5">
          หมายเลขนัดหมายนี้ไม่มีในระบบ หรือคุณไม่มีสิทธิ์เข้าถึง
        </p>
        <Link to="/my-appointments" className="text-blue-800 hover:underline">
          กลับไปนัดหมายของฉัน
        </Link>
      </div>
    );
  }

  // idle should not happen (useQuery starts in 'submitting'), but guard anyway
  if (state.kind === 'idle') return null;

  const appt = state.data;

  // Queue widget: driven by the appointment's own queueNumber and status only.
  // No cross-patient data is fetched (PDPA). The numeric part of the queue
  // number is used purely for display — "คิวของคุณ".
  const showQueue = !isPastDate(appt.date) && appt.status !== 'cancelled';

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

            <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-0.5 sm:gap-y-2 [&>dt]:text-xs [&>dt]:text-gray-400 [&>dt]:uppercase [&>dt]:tracking-wide [&>dt]:pt-3 [&>dt:first-child]:pt-0 [&>dt]:sm:text-base [&>dt]:sm:normal-case [&>dt]:sm:tracking-normal [&>dt]:sm:text-gray-500 [&>dt]:sm:pt-0">
              <dt className="text-gray-500">ผู้รับบริการ</dt>
              <dd className="font-medium">{appt.userFullName}</dd>
              {user && (
                <>
                  <dt className="text-gray-500">เลข ปชช.</dt>
                  <dd className="font-medium font-mono">
                    {maskNationalId(user.nationalId)}
                  </dd>
                </>
              )}
              <dt className="text-gray-500">โรงพยาบาล</dt>
              <dd className="font-medium">
                {hospital?.shortName ?? appt.hospitalId}
              </dd>
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

          {showQueue && (
            <section className="bg-white border border-gov-border p-5">
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-gov-border">
                <h2 className="text-lg font-semibold">สถานะคิวสด</h2>
               
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-center">
                <div className="border-2 border-gov-wait-ink p-4">
                  <p className="text-xs text-gray-500 mb-1">สถานะนัดหมาย</p>
                  <p className="text-xl font-bold text-gov-wait-ink">
                    {appointmentStatusLabel[appt.status]}
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
            <QrStub queue_id={appt.id} fullname={appt.userFullName} status={appt.status} />
            <p className="text-xs text-gray-500 mt-2">
              แสดงที่จุดเช็กอินวันนัด
            </p>
          </div>

          {hospital && (
            <div className="bg-white border border-gov-border p-4 text-sm">
              <strong className="block mb-2 pb-2 border-b border-gov-border">
                ติดต่อ {hospital.shortName}
              </strong>
              <p className="mb-1 flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 10.8c-.2-1-.9-1.7-1.8-1.8l-1.8-.3c-.4-.1-.8.1-1 .5l-.8 1.5c-2-.9-3.5-2.5-4.4-4.4L5.7 5.6c.2-.3.3-.7.2-1.1L5.5 2.7C5.3 1.8 4.7 1.1 3.8 1h-.5C2.1 1 1 2.1 1 3.3c0 6.5 5.3 11.7 11.7 11.7C14 15 15 13.9 15 12.7v-.5c0-.5-.1-.9-.4-1.4z"/></svg>
                {hospital.phone}
              </p>
              <p className="text-gray-500 text-xs">{hospital.address}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/my-appointments" replace />;

  return <AppointmentDetailInner id={id} />;
}
