import { Injectable } from '@nestjs/common';
import type { Zone } from '@prisma/client';
import type { HospitalsQuery } from '../../../shared/api';
import { ApiError } from '../common/errors/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toHospitalDto, toTimeSlotDto } from '../services/mappers.js';

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listHospitals(q: HospitalsQuery) {
    const rows = await this.prisma.hospital.findMany({
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

  async getHospitalDetail(id: string) {
    const hospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) throw new ApiError('ไม่พบโรงพยาบาล', 404, 'NOT_FOUND');
    return { hospital: toHospitalDto(hospital) };
  }

  async listTimeSlots(hospitalId: string, date: string) {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const slots = await this.prisma.schedule.findMany({
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
}
