import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useHospitals } from '@/lib/hospitals';
import { useAuth } from '@/lib/auth';

const BENEFITS = [
  'รองรับสิทธิ UC · สปสช. · ข้าราชการ',
  'เลือกช่วงเวลาที่สะดวก จองล่วงหน้าได้หลายสัปดาห์',
  'รับหมายเลขคิวออนไลน์ ไม่ต้องมายืนรอตั้งแต่เช้า',
];

const STATS = [
  { value: '45', label: 'โรงพยาบาล' },
  { value: '50+', label: 'คลินิก' },
  { value: 'ฟรี', label: 'ไม่มีค่าใช้จ่าย' },
];

export function Landing() {
  const { state } = useHospitals({});
  const { isAuthenticated } = useAuth();
  const hospitals = state.kind === 'success' ? state.data : [];

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-badge', { y: 14, opacity: 0, duration: 0.45 })
        .from('.hero-title', { y: 22, opacity: 0, duration: 0.55 }, '-=0.25')
        .from('.hero-desc', { y: 16, opacity: 0, duration: 0.45 }, '-=0.25')
        .from('.hero-cta', { y: 12, opacity: 0, stagger: 0.1, duration: 0.4 }, '-=0.2')
        .from('.hero-card', { x: 28, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.55')
        .from('.hero-stat', { y: 10, opacity: 0, stagger: 0.08, duration: 0.35 }, '-=0.3')
        .from('.feature-card', { y: 20, opacity: 0, stagger: 0.1, duration: 0.45 }, '-=0.1');
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="bg-gov-primary-tint border-b border-gov-border">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-[3fr_2fr] gap-8 items-center">
          <div>
            <span className="hero-badge inline-block bg-gov-yellow text-gov-ink font-semibold text-xs px-2 py-1 mb-4 border border-gov-ink">
              บริการของ กทม.
            </span>
            <h1 className="hero-title text-3xl md:text-4xl font-bold mb-3 leading-tight text-gov-ink">
              จองคิวโรงพยาบาลรัฐ
              <br />
              ง่ายกว่าเดิม สำหรับคนกรุงเทพ
            </h1>
            <p className="hero-desc text-lg text-gray-700 mb-6">
              ค้นหาโรงพยาบาล จองคิวล่วงหน้า ตรวจสอบสถานะคิว ในระบบเดียว
              <br />
              ไม่ต้องไปยืนรอตั้งแต่ตี 5
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/search"
                className="hero-cta inline-block px-5 py-3 font-semibold text-gov-primary bg-white border-2 border-gov-primary hover:bg-gov-primary-tint"
              >
                ดูโรงพยาบาลที่รองรับ
              </Link>
            </div>
          </div>

          {/* Stat card */}
          <div className="hero-card bg-white border-2 border-gov-ink p-5 sm:p-6">
            {/* Status bar */}
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gov-border">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-ok-ink animate-pulse" />
              <span className="text-sm font-semibold text-gov-ink">
                ให้บริการออนไลน์ 24 ชม.
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pb-4 mb-4 border-b border-gov-border text-center">
              {STATS.map(({ value, label }) => (
                <div key={label} className="hero-stat">
                  <p className="text-[1.9rem] font-bold text-gov-primary leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <ul className="space-y-2.5 text-sm text-gray-700">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#2e7d32"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M3 8l3.5 3.5L13 4" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── ทำไมเลือก CareKan? ─── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6 text-center">ทำไมเลือก CareKan?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <article className="feature-card bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="w-11 h-11 mb-4 bg-gov-primary-tint border border-gov-border flex items-center justify-center" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b4d8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">ประหยัดเวลา</h3>
            <p className="text-gray-700">
              ไม่ต้องตื่นตี 5 ไปต่อแถวรับบัตรคิว จองล่วงหน้า ระบุช่วงเวลา และมาตามนัด
            </p>
          </article>
          <article className="feature-card bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="w-11 h-11 mb-4 bg-gov-primary-tint border border-gov-border flex items-center justify-center" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b4d8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21V9l9-6 9 6v12H3z" />
                <path d="M9 21v-6h6v6" />
                <path d="M12 9v4M10 11h4" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">ครอบคลุม รพ. รัฐทั่ว กทม.</h3>
            <p className="text-gray-700">
              ครอบคลุม 45 โรงพยาบาลในเครือ สำนักการแพทย์ กทม.
            </p>
          </article>
          <article className="feature-card bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="w-11 h-11 mb-4 bg-gov-primary-tint border border-gov-border flex items-center justify-center" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b4d8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="6" r="2.5" />
                <path d="M12 10v5" />
                <path d="M9 13h6" />
                <path d="M10 15l-2 4M14 15l2 4" />
                <path d="M17 9l2-1M7 9L5 8" strokeWidth="1.25" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">ใช้ง่ายสำหรับผู้สูงอายุ</h3>
            <p className="text-gray-700">
              ปรับขนาดตัวอักษรและปุ่มได้ในคลิกเดียวด้วยโหมดผู้สูงวัย
            </p>
          </article>
        </div>
      </section>

      {/* ─── ใช้งานยังไง? ─── */}
      <section className="bg-white border-y border-gov-border py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">ใช้งานยังไง?</h2>
          <ol className="grid md:grid-cols-4 gap-5">
            {[
              ['ค้นหา รพ.', 'เลือกตามเขตหรือบริการที่ใช้'],
              ['เลือกวันและเวลา', 'ดูช่วงที่ว่างได้แบบเรียลไทม์'],
              ['ยืนยันการจอง', 'รับหมายเลขจองและรายละเอียดทันที'],
              ['ไปตามนัด', 'แสดงหมายเลขคิวที่ประชาสัมพันธ์'],
            ].map(([t, d], i) => (
              <li key={t} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 grid place-items-center bg-gov-primary text-white font-bold text-xl border-2 border-gov-primary-dark">
                  {i + 1}
                </div>
                <strong className="block mb-1">{t}</strong>
                <p className="text-sm text-gray-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── โรงพยาบาลที่รองรับ ─── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-2">โรงพยาบาลที่รองรับในเครือ กทม.</h2>
        <p className="text-gray-600 mb-5 text-sm">
          ครอบคลุม 45 โรงพยาบาลของสำนักการแพทย์ กรุงเทพมหานคร
        </p>
        {state.kind === 'submitting' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border border-gov-border px-4 py-3 h-12 animate-pulse" />
            ))}
          </div>
        )}
        {state.kind === 'error' && (
          <p className="text-gov-err-ink text-sm py-2">
            ไม่สามารถโหลดรายชื่อโรงพยาบาลได้ กรุณาลองใหม่อีกครั้ง
          </p>
        )}
        {hospitals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {hospitals.map((h) => (
              <Link
                key={h.id}
                to={`/hospitals/${h.id}`}
                className="bg-white border border-gov-border px-4 py-3 hover:border-gov-primary"
              >
                {h.shortName}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── CTA (เฉพาะ guest) ─── */}
      {!isAuthenticated && (
        <section className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h2 className="text-2xl font-bold mb-3">เริ่มจองคิวล่วงหน้าได้เลย</h2>
          <p className="text-gray-700 mb-5">
            ใช้เลขบัตรประจำตัวประชาชนสมัครใช้บริการ ฟรี ไม่มีค่าใช้จ่าย
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
          >
            สมัครใช้งาน
          </Link>
          <span className="mx-3 text-gray-500">หรือ</span>
          <Link to="/login" className="text-gov-primary font-semibold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </section>
      )}
    </>
  );
}
