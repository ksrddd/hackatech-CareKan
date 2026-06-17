interface GovFooterProps {
  variant?: 'citizen' | 'admin';
}

export function GovFooter({ variant = 'citizen' }: GovFooterProps) {
  if (variant === 'admin') {
    return (
      <footer className="border-t border-gov-border bg-white py-4 px-4 text-[0.8rem] text-gray-500">
        <div className="max-w-7xl mx-auto flex justify-between gap-4 flex-wrap">
          <span>
            <strong className="text-gov-ink">ระบบเจ้าหน้าที่ CareKan</strong> —
            สำหรับใช้ภายในโรงพยาบาลในเครือ กทม. เท่านั้น
          </span>
          <span>เวอร์ชัน 0.1.0 · Hackathon Prototype · Mock Data</span>
        </div>
      </footer>
    );
  }
  return (
    <footer className="border-t border-gov-border bg-white py-6 px-4 text-[0.85rem] text-gray-500">
      <div className="max-w-6xl mx-auto flex justify-between gap-4 flex-wrap">
        <div>
          <strong className="text-gov-ink">สำนักการแพทย์ กรุงเทพมหานคร</strong>
          <br />
          514 ถนนหลวง แขวงป้อมปราบ เขตป้อมปราบศัตรูพ่าย กรุงเทพฯ 10100
          <br />
          โทรสายด่วน 1555 (24 ชม.)
        </div>
        <div>
          <a href="#" className="text-blue-800 hover:underline">
            นโยบายความเป็นส่วนตัว
          </a>{' '}
          ·{' '}
          <a href="#" className="text-blue-800 hover:underline">
            เงื่อนไขการใช้บริการ
          </a>{' '}
          ·{' '}
          <a href="#" className="text-blue-800 hover:underline">
            ความช่วยเหลือสำหรับผู้พิการ
          </a>
        </div>
      </div>
    </footer>
  );
}
