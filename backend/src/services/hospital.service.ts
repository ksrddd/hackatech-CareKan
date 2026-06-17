import type { HospitalsQuery } from '../../../shared/api';
import type { ClinicCode } from '../../../shared/types';
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
  const clinicRows = await prisma.schedule.findMany({
    where: { hospitalId: id }, distinct: ['clinic'], select: { clinic: true },
  });
  const clinics: ClinicCode[] = clinicRows.map((c) => c.clinic);
  return { hospital: toHospitalDto(hospital), clinics };
}

export async function listTimeSlots(hospitalId: string, date: string, clinic: ClinicCode) {
  const rows = await prisma.schedule.findMany({
    where: { hospitalId, date, clinic }, orderBy: { startTime: 'asc' },
  });
  return rows.map(toTimeSlotDto);
}
