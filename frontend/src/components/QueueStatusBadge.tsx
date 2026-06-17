import type { AppointmentStatus } from '@/lib/types';
import { appointmentStatusLabel } from '@/lib/types';

interface QueueStatusBadgeProps {
  status: AppointmentStatus;
  detail?: string;
}

const colorMap: Record<AppointmentStatus, string> = {
  pending: 'border-gov-wait-ink bg-gov-wait-bg text-gov-wait-ink',
  confirmed: 'border-gov-primary-dark bg-gov-primary-tint text-gov-primary-dark',
  checked_in: 'border-gov-wait-ink bg-gov-wait-bg text-gov-wait-ink',
  in_progress: 'border-gov-primary-dark bg-gov-primary-tint text-gov-primary-dark',
  completed: 'border-gov-ok-ink bg-gov-ok-bg text-gov-ok-ink',
  cancelled: 'border-gray-400 bg-gray-100 text-gray-600',
  no_show: 'border-gov-err-ink bg-gov-err-bg text-gov-err-ink',
};

export function QueueStatusBadge({ status, detail }: QueueStatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold border ${colorMap[status]}`}
    >
      {appointmentStatusLabel[status]}
      {detail && <span className="font-normal"> · {detail}</span>}
    </span>
  );
}
