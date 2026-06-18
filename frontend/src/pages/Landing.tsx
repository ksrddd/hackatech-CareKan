import { Link } from 'react-router-dom';
import { useHospitals } from '@/lib/hospitals';

export function Landing() {
  const { state } = useHospitals({});
  const hospitals = state.kind === 'success' ? state.data : [];

  return (
    <>
      <section className="bg-gov-primary-tint border-b border-gov-border">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-[3fr_2fr] gap-8 items-center">
          <div>
            <span className="inline-block bg-gov-yellow text-gov-ink font-semibold text-xs px-2 py-1 mb-4 border border-gov-ink">
              บริการของ กทม.
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight text-gov-ink">
              จองคิวโรงพยาบาลรัฐ
              <br />
              ง่ายกว่าเดิม สำหรับคนกรุงเทพ
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              ค้นหาโรงพยาบาล จองคิวล่วงหน้า ตรวจสอบสถานะคิว ในระบบเดียว
              <br />
              ไม่ต้องไปยืนรอตั้งแต่ตี 5
            </p>
            <div className="flex flex-wrap gap-3">

              <Link
                to="/search"
                className="inline-block px-5 py-3 font-semibold text-gov-primary bg-white border-2 border-gov-primary hover:bg-gov-primary-tint"
              >
                ดูโรงพยาบาลที่รองรับ
              </Link>
            </div>
          </div>
          <div>
            <div className="bg-white border-2 border-gov-ink p-5">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <span className="demo-pin">ตัวอย่าง</span>
                <span>นัดถัดไปของคุณ</span>
              </div>
              <p className="text-2xl font-bold mb-1">14 ก.ค. 2568 · 09:00 น.</p>
              <p className="mb-2 text-gov-ink">รพ.กลาง · นัดติดตามอาการ</p>
              <p className="font-mono text-sm text-gray-600 mb-4">
                หมายเลขจอง: CK-A2K9N4
              </p>
              <div className="flex items-center justify-between bg-gov-primary-tint border-l-4 border-gov-primary px-3 py-2 text-sm">
                <span>คิวที่ของคุณ</span>
                <span className="text-3xl font-bold text-gov-primary">A045</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6 text-center">ทำไมเลือก CareKan?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <article className="bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="text-3xl mb-2" aria-hidden="true">
              🕐
            </div>
            <h3 className="font-bold text-lg mb-2">ประหยัดเวลา</h3>
            <p className="text-gray-700">
              ไม่ต้องตื่นตี 5 ไปต่อแถวรับบัตรคิว จองล่วงหน้า ระบุช่วงเวลา และมาตามนัด
            </p>
          </article>
          <article className="bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="text-3xl mb-2" aria-hidden="true">
              🏥
            </div>
            <h3 className="font-bold text-lg mb-2">ครอบคลุม รพ. รัฐทั่ว กทม.</h3>
            <p className="text-gray-700">
              เริ่มต้นด้วย 9 โรงพยาบาลในเครือ สำนักการแพทย์ กทม.
            </p>
          </article>
          <article className="bg-white border border-gov-border p-5 border-t-4 border-t-gov-primary">
            <div className="text-3xl mb-2" aria-hidden="true">
              👴
            </div>
            <h3 className="font-bold text-lg mb-2">ใช้ง่ายสำหรับผู้สูงอายุ</h3>
            <p className="text-gray-700">
              ปรับขนาดตัวอักษรและปุ่มได้ในคลิกเดียวด้วยโหมดผู้สูงวัย
            </p>
          </article>
        </div>
      </section>

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

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-2">โรงพยาบาลที่รองรับในเครือ กทม.</h2>
        <p className="text-gray-600 mb-5 text-sm">
          เริ่มต้นด้วย 9 โรงพยาบาลของสำนักการแพทย์ กรุงเทพมหานคร
        </p>
        {state.kind === 'submitting' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border border-gov-border px-4 py-3 h-12 animate-pulse" />
            ))}
          </div>
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
    </>
  );
}
