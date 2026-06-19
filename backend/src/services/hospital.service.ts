import type { HospitalsQuery } from '../../../shared/api';
import type { Zone } from '@prisma/client';
import { prisma } from '../prisma.js';
import { toHospitalDto, toTimeSlotDto } from './mappers.js';
import { ApiError } from '../errors.js';

export async function listHospitals(q: HospitalsQuery) {
  const rows = await prisma.hospital.findMany({
    where: {
      ...(q.zone ? { zone: q.zone as Zone } : {}),
      ...(q.district ? { district: { contains: q.district } } : {}),
      ...(q.service ? { services: { has: q.service } } : {}),
      ...(q.right ? { rightsAccepted: { has: q.right } } : {}),
      ...(q.q ? { OR: [{ name: { contains: q.q } }, { shortName: { contains: q.q } }] } : {}),
    },
    orderBy: { mockDistanceKm: 'asc' },
  });
  return rows.map(toHospitalDto);
}

export async function getHospitalDetail(id: string) {
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) throw new ApiError('ไม่พบโรงพยาบาล', 404, 'NOT_FOUND');
  return { hospital: toHospitalDto(hospital) };
}

export async function listTimeSlots(hospitalId: string, date: string) {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const slots = await prisma.schedule.findMany({
    where: { dayOfWeek },
    orderBy: { startTime: 'asc' },
    include: {
      reserves: {
        where: { hospitalId, date },
        select: { id: true },
      },
    },
  });
  return slots.map((slot) => toTimeSlotDto(slot, hospitalId, date, slot.reserves.length));
}
