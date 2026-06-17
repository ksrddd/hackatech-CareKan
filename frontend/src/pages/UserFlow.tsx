import { Link } from 'react-router-dom';

interface RouteRowProps {
  path: string;
  description: string;
  access: 'public' | 'citizen' | 'admin';
}

const ACCESS_LABEL: Record<RouteRowProps['access'], { label: string; cls: string }> = {
  public: { label: 'PUBLIC', cls: 'bg-gray-100 text-gray-700 border-gov-border' },
  citizen: { label: 'CITIZEN', cls: 'bg-gov-primary-tint text-gov-primary-dark border-gov-primary' },
  admin: { label: 'ADMIN', cls: 'bg-gov-ink text-gov-yellow border-gov-primary-dark' },
};

const ROUTES: RouteRowProps[] = [
  { path: '/', description: 'หน้า Landing · hero · value props · รายชื่อ 9 รพ.', access: 'public' },
  { path: '/login', description: 'เข้าสู่ระบบด้วยเลข ปชช. 13 หลัก + รหัสผ่าน', access: 'public' },
  { path: '/register', description: 'สมัครใช้งาน 4 ขั้น (PDPA → ข้อมูล → ติดต่อ → รหัสผ่าน)', access: 'public' },
  { path: '/search', description: 'ค้นหา รพ. กรองเขต/บริการ/สิทธิ์ · เรียงตามระยะทาง', access: 'public' },
  { path: '/hospitals/:id', description: 'รายละเอียดโรงพยาบาล · คลินิก · สิทธิ์ · ปุ่มจองคิว', access: 'public' },
  { path: '/my-appointments', description: 'นัดที่กำลังมาถึง + ประวัติ + ข้อมูลผู้รับบริการ', access: 'citizen' },
  { path: '/book', description: 'จองคิว 3-step wizard (รพ.+คลินิก → วันเวลา → ยืนยัน)', access: 'citizen' },
  { path: '/book/success/:id', description: 'จองสำเร็จ · QR · booking ref · checklist เตรียมตัว', access: 'citizen' },
  { path: '/appointments/:id', description: 'รายละเอียดนัด + live queue (poll 5 วินาที) + ownership check', access: 'citizen' },
  { path: '/admin', description: 'Dashboard เจ้าหน้าที่ · KPI · กราฟ · recent bookings · ห้องตรวจ', access: 'admin' },
  { path: '/admin/queue', description: 'จัดการคิววันนี้ · ตาราง + actions (เรียก/เสร็จ/ไม่มา)', access: 'admin' },
];

export function UserFlow() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        › User Flow
      </p>
      <h1 className="text-2xl font-bold mb-1">User Flow · เส้นทางการใช้งาน</h1>
      <p className="text-gray-600 mb-5">
        แผนภาพแสดงทุกหน้าและทุกเส้นทางในระบบ CareKan ทั้งฝั่งผู้รับบริการ (citizen)
        และเจ้าหน้าที่ (admin) รวมถึงจุดที่ข้อมูลไหลข้ามฝั่งกัน
      </p>

      <section className="bg-white border-2 border-gov-ink p-3 mb-6 overflow-x-auto">
        <img
          src="/user-flow.svg"
          alt="แผนภาพ User Flow ของ CareKan — Public → Citizen / Admin + data sync"
          className="w-full h-auto min-w-[1100px]"
        />
        <p className="text-xs text-gray-500 text-center mt-2">
          ดูภาพเต็มที่{' '}
          <a
            href="/user-flow.svg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 hover:underline"
          >
            เปิด user-flow.svg แยก tab
          </a>
        </p>
      </section>

      <section className="bg-white border border-gov-border p-5 mb-5">
        <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
          ตารางเส้นทาง (Route map)
        </h2>
        <table className="w-full text-[0.95rem] border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-900">
              <th className="text-left p-2 font-semibold text-sm w-[120px]">สิทธิ์</th>
              <th className="text-left p-2 font-semibold text-sm w-[260px]">URL</th>
              <th className="text-left p-2 font-semibold text-sm">หน้าที่</th>
            </tr>
          </thead>
          <tbody>
            {ROUTES.map((r) => {
              const a = ACCESS_LABEL[r.access];
              return (
                <tr key={r.path} className="border-b border-gov-border">
                  <td className="p-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold border ${a.cls}`}
                    >
                      {a.label}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-sm">{r.path}</td>
                  <td className="p-2">{r.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-gov-border p-5 mb-5">
        <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
          จุดที่ข้อมูลข้ามฝั่ง (Cross-side data sync)
        </h2>
        <ol className="list-decimal pl-6 space-y-2 text-[0.95rem]">
          <li>
            <strong>Citizen จอง</strong> → <code className="font-mono">createBooking()</code> เขียน
            ลง <code className="font-mono">localStorage.carekan.bookings</code> → admin Dashboard
            และ Queue View อ่านได้ทันที (poll ทุก 5 วินาที)
          </li>
          <li>
            <strong>Admin update สถานะ</strong> (เรียกคิว / เสร็จสิ้น / ไม่มา) →{' '}
            <code className="font-mono">updateStatus()</code> เขียนลง{' '}
            <code className="font-mono">localStorage.carekan.statusOverrides</code> → ผู้ป่วยฝั่ง
            citizen เห็นใน{' '}
            <Link to="/appointments/a-1001" className="text-blue-800 hover:underline">
              /appointments/:id
            </Link>{' '}
            ภายใน 5 วินาที
          </li>
        </ol>
        <p className="mt-3 text-sm text-gray-600">
          ⚠ ปัจจุบันเป็น mock บน localStorage ของ browser ตัวเอง · เมื่อ backend จริงเชื่อมแล้ว
          จะเปลี่ยนเป็น SSE / WebSocket หรือ poll API ตามที่ทีม backend ตัดสินใจ
        </p>
      </section>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="px-5 py-3 font-semibold text-gov-primary bg-white border-2 border-gov-primary hover:bg-gov-primary-tint"
        >
          ← กลับหน้าหลัก
        </Link>
        <Link
          to="/login"
          className="px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
        >
          ลองใช้งานจริง →
        </Link>
      </div>
    </div>
  );
}
