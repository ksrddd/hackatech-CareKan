import { Link } from 'react-router-dom';
import { serviceTypeLabel } from '@/lib/types';
import type { Hospital } from '@/lib/types';

interface HospitalCardProps {
  hospital: Hospital;
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  return (
    <article className="bg-white border border-gov-border p-4 hover:border-gov-primary transition-colors">
      <div className="flex gap-4 flex-wrap">
        <div className="w-16 h-16 grid place-items-center bg-gov-primary-tint border-2 border-gov-primary text-gov-primary font-bold text-xl">
          {hospital.code}
        </div>
        <div className="flex-1 min-w-[240px]">
          <h3 className="font-bold text-lg mb-1">{hospital.shortName}</h3>
          <p className="text-sm text-gray-600">
            เขต{hospital.district} · {hospital.mockDistanceKm.toFixed(1)} กม.
            (โดยประมาณ)
          </p>
          <p className="text-sm mt-2 flex flex-wrap gap-1">
            {hospital.services.slice(0, 3).map((s) => (
              <span
                key={s}
                className="inline-block bg-gray-100 px-2 py-0.5 border border-gov-border"
              >
                {serviceTypeLabel[s]}
              </span>
            ))}
            {hospital.services.length > 3 && (
              <span className="inline-block bg-gray-100 px-2 py-0.5 border border-gov-border">
                +{hospital.services.length - 3}
              </span>
            )}
          </p>
        </div>
        <div className="text-right min-w-[150px]">
          <p className="text-xs text-gray-500 mb-1">สถานะการจอง</p>
          <p className="text-lg font-bold text-gov-ok-ink">เปิดจองคิว</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gov-border">
        <span className="text-xs text-gray-500">
          สิทธิที่ใช้ได้: บัตรทอง · ประกันสังคม · ขรก. · ชำระเอง
        </span>
        <div className="flex gap-2">
          <Link
            to={`/hospitals/${hospital.id}`}
            className="px-3 py-1.5 text-sm border border-gov-border hover:bg-gov-primary-tint"
          >
            ดูรายละเอียด
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
