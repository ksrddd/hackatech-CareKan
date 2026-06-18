import { Link } from 'react-router-dom';
import { serviceTypeLabel } from '@/lib/types';
import type { Hospital } from '@/lib/types';

interface HospitalCardProps {
  hospital: Hospital;
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  return (
    <article className="bg-white border border-gov-border p-4 hover:border-gov-primary transition-colors">
      <div className="flex gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 grid place-items-center bg-gov-primary-tint border-2 border-gov-primary text-gov-primary font-bold text-lg sm:text-xl">
          {hospital.code}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
            <h3 className="font-bold text-base sm:text-lg leading-snug">{hospital.shortName}</h3>
            <span className="text-sm font-bold text-gov-ok-ink shrink-0">เปิดจองคิว</span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">
            เขต{hospital.district} · {hospital.mockDistanceKm.toFixed(1)} กม.
          </p>
          <p className="text-sm mt-1.5 flex flex-wrap gap-1">
            {hospital.services.slice(0, 3).map((s) => (
              <span
                key={s}
                className="inline-block bg-gray-100 px-2 py-0.5 border border-gov-border text-xs"
              >
                {serviceTypeLabel[s]}
              </span>
            ))}
            {hospital.services.length > 3 && (
              <span className="inline-block bg-gray-100 px-2 py-0.5 border border-gov-border text-xs">
                +{hospital.services.length - 3}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mt-3 pt-3 border-t border-gov-border gap-y-2">
        <span className="text-xs text-gray-500">
          บัตรทอง · ประกันสังคม · ขรก. · ชำระเอง
        </span>
        <div className="flex gap-2">
          <Link
            to={`/hospitals/${hospital.id}`}
            className="px-3 py-1.5 text-sm border border-gov-border hover:bg-gov-primary-tint"
          >
            รายละเอียด
          </Link>
          <Link
            to={`/book?hospital=${hospital.id}`}
            className="px-3 py-1.5 text-sm bg-gov-primary text-white border border-gov-primary-dark font-semibold hover:bg-gov-primary-dark"
          >
            จองคิว →
          </Link>
        </div>
      </div>
    </article>
  );
}
