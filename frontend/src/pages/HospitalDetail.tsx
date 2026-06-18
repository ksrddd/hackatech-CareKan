import { Link, Navigate, useParams } from 'react-router-dom';
import { useHospital } from '@/lib/hospitals';
import {
  clinicLabel,
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

  const { hospital, clinics } = state.data;

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
        <div className="flex gap-4 flex-wrap">
          <div className="w-20 h-20 grid place-items-center bg-gov-primary text-white font-bold text-2xl border-2 border-gov-primary-dark">
            {hospital.code}
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-bold mb-1">{hospital.shortName}</h1>
            <p className="text-sm text-gray-600 mb-2">
              {hospital.address} · {hospital.mockDistanceKm.toFixed(1)} กม. (โดยประมาณ)
            </p>
            <p className="text-sm">
              <span className="inline-block bg-gov-ok-bg text-gov-ok-ink px-2 py-0.5 border border-gov-ok-ink font-semibold">
                เปิดให้บริการ
              </span>
              <span className="text-gray-600 ml-2">{hospital.openingHours}</span>
            </p>
          </div>
          <div className="text-right min-w-[200px]">
            <Link
              to={`/book?hospital=${hospital.id}`}
              className="block w-full px-4 py-3 text-center font-bold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
            >
              จองคิว
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              เลือกคลินิก วันและช่วงเวลาในขั้นถัดไป
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
              คลินิก / แผนกที่เปิด
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {clinics.map((c) => (
                <span
                  key={c}
                  className="inline-block px-3 py-1.5 border border-gov-border bg-gray-50"
                >
                  {clinicLabel[c]}
                </span>
              ))}
            </div>
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
                className="inline-flex items-center gap-1 text-blue-800 hover:underline"
              >
                🧭 เปิดใน Google Maps (นำทาง)
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
            <p className="mb-1">📞 {hospital.phone}</p>
            <p className="text-gray-500 text-xs">
              สอบถามคิวออนไลน์: 1555 (24 ชม.)
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
