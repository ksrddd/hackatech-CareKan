import { Link, Navigate, useParams } from 'react-router-dom';
import { useHospital } from '@/lib/hospitals';
import {
  insuranceRightLabel,
  serviceTypeLabel,
} from '@/lib/types';

export function HospitalDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/search" replace />;

  const { state } = useHospital(id);

  if (state.kind === 'idle' || state.kind === 'submitting') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
        <div className="bg-white border border-gov-border p-8 text-center text-gray-500 animate-pulse">
          กำลังโหลดข้อมูลโรงพยาบาล…
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    const isNotFound = state.error.status === 404;
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
        <div className="bg-white border border-gov-err-ink p-8 text-center text-gov-err-ink">
          {isNotFound
            ? 'ไม่พบโรงพยาบาลที่ค้นหา'
            : `เกิดข้อผิดพลาด: ${state.error.message}`}
        </div>
        <div className="mt-4 text-center">
          <Link to="/search" className="text-blue-800 hover:underline">
            กลับไปค้นหาโรงพยาบาล
          </Link>
        </div>
      </div>
    );
  }

  const { hospital } = state.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-3">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        ›{' '}
        <Link to="/search" className="text-blue-800 hover:underline">
          ค้นหาโรงพยาบาล
        </Link>{' '}
        › {hospital.shortName}
      </p>

      <section className="bg-white border-2 border-gov-ink p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 grid place-items-center bg-gov-primary text-white font-bold text-xl sm:text-2xl border-2 border-gov-primary-dark">
            {hospital.code}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">{hospital.shortName}</h1>
            <p className="text-sm text-gray-600 mb-2">
              {hospital.address} · {hospital.mockDistanceKm.toFixed(1)} กม.
            </p>
            <p className="text-sm">
              <span className="inline-block bg-gov-ok-bg text-gov-ok-ink px-2 py-0.5 border border-gov-ok-ink font-semibold">
                เปิดให้บริการ
              </span>
              <span className="text-gray-600 ml-2">{hospital.openingHours}</span>
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <Link
              to={`/book?hospital=${hospital.id}`}
              className="block px-4 py-3 text-center font-bold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
            >
              จองคิว
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              เลือกวันและช่วงเวลาในขั้นถัดไป
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div>
          <section className="bg-white border border-gov-border p-5 mb-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              บริการที่เปิดให้จอง
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {hospital.services.map((s) => (
                <li
                  key={s}
                  className="border border-gov-border px-3 py-2 flex justify-between items-center"
                >
                  <span>{serviceTypeLabel[s]}</span>
                  <span className="text-xs text-gov-ok-ink">เปิดรับ</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-gov-border p-5 mb-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              เกี่ยวกับโรงพยาบาล
            </h2>
            <p className="text-[0.95rem]">{hospital.description}</p>
          </section>

          <section className="bg-white border border-gov-border p-5">
            <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
              สิทธิการรักษาที่รองรับ
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {hospital.rightsAccepted.map((r) => (
                <div
                  key={r}
                  className="border border-gov-border p-3 flex items-center justify-between"
                >
                  <span>{insuranceRightLabel[r]}</span>
                  <span className="bg-gov-ok-bg text-gov-ok-ink px-2 py-0.5 text-xs font-semibold border border-gov-ok-ink">
                    รองรับ
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="bg-white border border-gov-border">
            <iframe
              title={`แผนที่ ${hospital.shortName}`}
              className="w-full h-56 block border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                `${hospital.shortName} ${hospital.address}`,
              )}&z=16&hl=th&output=embed`}
            />
            <div className="p-4 text-sm space-y-2">
              <strong className="block">การเดินทาง</strong>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${hospital.shortName} ${hospital.address}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-800 hover:underline"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2a4 4 0 0 0-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-4-4z"/><circle cx="8" cy="6" r="1.5" fill="currentColor" stroke="none"/></svg>
                เปิดใน Google Maps (นำทาง)
              </a>
              <p className="text-gray-500 text-xs">
                แผนที่จาก Google · ปักหมุดอัตโนมัติจากชื่อและที่อยู่
              </p>
            </div>
          </section>

          <section className="bg-white border border-gov-border p-4 text-sm">
            <strong className="block mb-2 pb-2 border-b border-gov-border">
              ติดต่อ
            </strong>
            <p className="mb-1 flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 10.8c-.2-1-.9-1.7-1.8-1.8l-1.8-.3c-.4-.1-.8.1-1 .5l-.8 1.5c-2-.9-3.5-2.5-4.4-4.4L5.7 5.6c.2-.3.3-.7.2-1.1L5.5 2.7C5.3 1.8 4.7 1.1 3.8 1h-.5C2.1 1 1 2.1 1 3.3c0 6.5 5.3 11.7 11.7 11.7C14 15 15 13.9 15 12.7v-.5c0-.5-.1-.9-.4-1.4z"/></svg>
                {hospital.phone}
              </p>
            <p className="text-gray-500 text-xs">
              สอบถามคิวออนไลน์: 1555 (24 ชม.)
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
