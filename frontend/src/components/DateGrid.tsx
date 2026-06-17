import { useMemo } from 'react';
import { buddhistYear, formatThaiWeekdayShort } from '@/lib/format';
import { getDayAvailability } from '@/lib/mockData';
import type { ClinicCode } from '@/lib/types';

interface DateGridProps {
  hospitalId: string;
  clinic: ClinicCode;
  selectedDate: string | null;
  onSelect: (iso: string) => void;
  monthOffset?: number;
}

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

interface Cell {
  iso: string;
  day: number;
  month: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  remaining: number;
  totalCapacity: number;
}

function buildCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    cells.push({
      iso,
      day: d.getDate(),
      month: d.getMonth(),
      isCurrentMonth: d.getMonth() === month,
      isPast: d.getTime() < today.getTime(),
      isToday: d.getTime() === today.getTime(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isHoliday: false,
      remaining: 0,
      totalCapacity: 0,
    });
  }
  return cells;
}

export function DateGrid({
  hospitalId,
  clinic,
  selectedDate,
  onSelect,
  monthOffset = 0,
}: DateGridProps) {
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const cells = useMemo(() => {
    const arr = buildCells(year, month);
    return arr.map((c) => {
      if (c.isPast || c.isWeekend || !c.isCurrentMonth) return c;
      const avail = getDayAvailability(hospitalId, clinic, c.iso);
      return {
        ...c,
        remaining: avail.remaining,
        totalCapacity: avail.totalCapacity,
      };
    });
  }, [year, month, hospitalId, clinic]);

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-gray-100 border border-gov-border mb-3">
        <strong className="text-base">
          {THAI_MONTHS[month]} {buddhistYear(baseDate)}
        </strong>
        <span className="flex-1" />
        <span className="text-sm text-gray-500 flex gap-2 items-center">
          <span className="inline-block px-2 py-0.5 text-xs border border-gov-border text-gray-500">
            ว่าง
          </span>
          <span className="inline-block px-2 py-0.5 text-xs border border-gov-wait-ink bg-gov-wait-bg text-gov-wait-ink">
            เหลือน้อย
          </span>
          <span className="inline-block px-2 py-0.5 text-xs border border-gov-border bg-gray-100 text-gray-500">
            เต็ม / ปิด
          </span>
        </span>
      </div>

      <div
        role="grid"
        aria-label={`ปฏิทินเลือกวันนัด ${THAI_MONTHS[month]} ${buddhistYear(baseDate)}`}
        className="grid grid-cols-7 border border-gov-border bg-white"
      >
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="bg-gray-100 text-center p-2 font-semibold text-sm border-r border-b border-gov-border last:border-r-0"
          >
            {wd}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isSelected = selectedDate === cell.iso;
          const disabled =
            !cell.isCurrentMonth ||
            cell.isPast ||
            cell.isWeekend ||
            cell.isHoliday ||
            cell.remaining <= 0;

          const base =
            'min-h-[70px] flex flex-col justify-between p-2 text-center text-sm border-b border-gov-border';
          const sideBorder = (i + 1) % 7 === 0 ? '' : 'border-r';

          if (disabled) {
            let hint = '';
            if (!cell.isCurrentMonth) hint = '';
            else if (cell.isToday) hint = 'วันนี้';
            else if (cell.isPast) hint = 'ผ่านมาแล้ว';
            else if (cell.isWeekend) hint = cell.day % 7 === 0 ? 'อาทิตย์' : 'เสาร์';
            else if (cell.remaining <= 0) hint = 'เต็ม';
            return (
              <div
                key={cell.iso + i}
                className={`${base} ${sideBorder} bg-gray-50 text-gray-500 cursor-not-allowed`}
                aria-disabled
              >
                <span className="font-semibold">
                  {cell.isCurrentMonth ? cell.day : ''}
                </span>
                <span className="text-xs">{hint}</span>
              </div>
            );
          }

          const lowCapacity = cell.remaining <= cell.totalCapacity * 0.2;

          return (
            <button
              key={cell.iso + i}
              type="button"
              onClick={() => onSelect(cell.iso)}
              className={`${base} ${sideBorder} cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gov-primary text-white font-semibold'
                  : lowCapacity
                    ? 'bg-gov-wait-bg text-gov-wait-ink hover:bg-gov-wait-ink hover:text-white'
                    : 'hover:bg-gov-primary-tint'
              }`}
              aria-label={`${cell.day} ${THAI_MONTHS[month]} เหลือ ${cell.remaining} คิว`}
              aria-pressed={isSelected}
            >
              <span className="font-semibold">{cell.day}</span>
              <span className={`text-xs ${isSelected ? 'opacity-85' : ''}`}>
                {formatThaiWeekdayShort(cell.iso)} · ว่าง {cell.remaining} คิว
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
