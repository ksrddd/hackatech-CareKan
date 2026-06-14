import { Link } from 'react-router-dom';

interface GovLogoProps {
  to?: string;
  title?: string;
  subtitle?: string;
}

export function GovLogo({
  to = '/',
  title = 'ระบบนัดหมายโรงพยาบาลรัฐ',
  subtitle = 'Bangkok Hospital Appointment Service',
}: GovLogoProps) {
  return (
    <Link to={to} className="flex items-center gap-3 no-underline text-gov-ink">
      <img
        src="/carekan-logo.jpg"
        alt="CareKan — แคร์กัน"
        width={48}
        height={48}
        className="h-12 w-auto object-contain"
      />
      <span className="leading-tight">
        <strong className="block text-base">{title}</strong>
        <span className="block text-xs text-gray-500">{subtitle}</span>
      </span>
    </Link>
  );
}
