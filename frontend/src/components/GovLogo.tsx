import { Link } from 'react-router-dom';

interface GovLogoProps {
  to?: string;
  title?: string;
  subtitle?: string;
}

export function GovLogo({
  to = '/',
  title = 'ระบบนัดหมายโรงพยาบาลรัฐ',
  subtitle = 'Bangkok Hospital Appointment Service · CareKan',
}: GovLogoProps) {
  return (
    <Link to={to} className="flex items-center gap-3 no-underline text-gov-ink">
      <span className="w-11 h-11 grid place-items-center bg-gov-primary text-white font-bold border-2 border-gov-primary-dark">
        กทม
      </span>
      <span className="leading-tight">
        <strong className="block text-base">{title}</strong>
        <span className="block text-xs text-gray-500">{subtitle}</span>
      </span>
    </Link>
  );
}
