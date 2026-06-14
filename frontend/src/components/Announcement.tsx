import type { ReactNode } from 'react';

interface AnnouncementProps {
  title?: string;
  variant?: 'info' | 'warn' | 'ok';
  children: ReactNode;
}

export function Announcement({
  title,
  variant = 'info',
  children,
}: AnnouncementProps) {
  const classes =
    variant === 'warn'
      ? 'border-gov-wait-ink bg-gov-wait-bg text-gov-wait-ink'
      : variant === 'ok'
        ? 'border-gov-ok-ink bg-gov-ok-bg text-gov-ok-ink'
        : 'border-gov-primary bg-gov-primary-tint text-gov-ink';
  return (
    <div className={`border-l-[6px] ${classes} px-4 py-3 text-[0.95rem]`}>
      {title && <strong className="block">{title}</strong>}
      {children}
    </div>
  );
}
