import { useMemo } from 'react';
import { generateSlots } from '@/lib/mockData';
import type { ClinicCode, TimeSlot } from '@/lib/types';

interface TimeSlotGridProps {
  hospitalId: string;
  clinic: ClinicCode;
  date: string;
  selectedSlotId: string | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({
  hospitalId,
  clinic,
  date,
  selectedSlotId,
  onSelect,
}: TimeSlotGridProps) {
  const slots = useMemo(
    () => generateSlots(hospitalId, clinic, date),
    [hospitalId, clinic, date],
  );
  const morning = slots.filter((s) => Number(s.startTime.split(':')[0]) < 12);
  const afternoon = slots.filter((s) => Number(s.startTime.split(':')[0]) >= 12);

  const renderRow = (rowSlots: TimeSlot[]) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
      {rowSlots.map((s) => {
        const isSelected = selectedSlotId === s.id;
        const full = s.booked >= s.capacity;
        const remaining = s.capacity - s.booked;
        if (full) {
          return (
            <div
              key={s.id}
              className="border-2 border-gov-border bg-gray-50 text-gray-500 text-center py-2 cursor-not-allowed line-through font-medium"
              aria-disabled
            >
              {s.startTime}
              <span className="block text-xs">เต็ม</span>
            </div>
          );
        }
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            aria-pressed={isSelected}
            className={`border-2 text-center py-2 font-medium transition-colors ${
              isSelected
                ? 'border-gov-primary-dark bg-gov-primary text-white'
                : 'border-gov-border bg-white hover:border-gov-primary hover:bg-gov-primary-tint'
            }`}
          >
            {s.startTime}
            <span
              className={`block text-xs ${isSelected ? 'opacity-85' : 'text-gray-500'}`}
            >
              {isSelected ? 'เลือกแล้ว' : `ว่าง ${remaining}/${s.capacity}`}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <p className="mt-3 mb-2 font-semibold text-[0.95rem] pb-1 border-b border-gov-border">
        ช่วงเช้า (08:00–12:00)
      </p>
      {renderRow(morning)}
      <p className="mt-4 mb-2 font-semibold text-[0.95rem] pb-1 border-b border-gov-border">
        ช่วงบ่าย (13:00–16:00)
      </p>
      {renderRow(afternoon)}
    </>
  );
}
