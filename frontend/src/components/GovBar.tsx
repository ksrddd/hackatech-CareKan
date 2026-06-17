import { ElderlyToggle } from './ElderlyToggle';

interface GovBarProps {
  variant?: 'citizen' | 'admin';
  right?: React.ReactNode;
}

export function GovBar({ variant = 'citizen', right }: GovBarProps) {
  const bg =
    variant === 'admin'
      ? 'bg-gov-primary-dark text-white'
      : 'bg-gov-ink text-white border-b-2 border-gov-yellow';

  return (
    <div className={`${bg} text-[0.82rem]`}>
      <div className="max-w-6xl mx-auto px-4 py-1 flex justify-between items-center gap-4 flex-wrap">
        <span>
          กรุงเทพมหานคร · สำนักการแพทย์
          {variant === 'admin' ? ' · ระบบเจ้าหน้าที่' : ''}
        </span>
        <span className="flex items-center gap-3">
          <ElderlyToggle />
          {right ?? <span>โทรสายด่วน 1555 (24 ชม.)</span>}
        </span>
      </div>
    </div>
  );
}
