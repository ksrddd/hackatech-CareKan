import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Appointment } from '../../../shared/types';
import { ApiError } from '../common/errors/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toAppointmentDto } from '../services/mappers.js';
import type { AuthenticatedHospitalKey } from './hospital-key.service.js';
import type { CreateHospitalReserveInput, HospitalReserveStatus } from './hospital-reserve.schemas.js';

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomRef(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return `CK-${out}`;
}

async function generateBookingCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomRef();
    const exists = await tx.reserve.findUnique({ where: { bookingCode: code } });
    if (!exists) return code;
  }
  throw new ApiError('ไม่สามารถสร้างรหัสการจองได้ ลองใหม่อีกครั้ง', 500, 'REF_COLLISION');
}

const RESERVE_INCLUDE = {
  schedule: true,
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ReserveInclude;

@Injectable()
export class HospitalReserveService {
  constructor(private readonly prisma: PrismaService) {}

  async createReserve(
    key: AuthenticatedHospitalKey,
    body: CreateHospitalReserveInput,
  ): Promise<Appointment> {
    if (body.hospitalId !== key.hospitalId) {
      throw new ApiError(
        'API key ไม่มีสิทธิ์สร้างการจองสำหรับโรงพยาบาลนี้',
        403,
        'HOSPITAL_MISMATCH',
      );
    }

    const patient = await this.prisma.user.findUnique({
      where: { nationalId: body.patientNationalId },
    });
    if (!patient) throw new ApiError('ไม่พบข้อมูลผู้ป่วย', 404, 'PATIENT_NOT_FOUND');

    const reserve = await this.prisma.$transaction(async (tx) => {
      const slot = await tx.schedule.findUnique({ where: { id: body.scheduleId } });
      if (!slot) {
        throw new ApiError('ไม่พบช่วงเวลานี้', 404, 'SLOT_NOT_FOUND');
      }
      const dayOfWeek = new Date(body.date + 'T00:00:00').getDay();
      if (slot.dayOfWeek !== dayOfWeek) {
        throw new ApiError('วันที่ไม่ตรงกับตารางเวลา', 400, 'DATE_MISMATCH');
      }
      const booked = await tx.reserve.count({
        where: { hospitalId: body.hospitalId, scheduleId: slot.id, date: body.date },
      });
      if (booked >= slot.maxCapacity) {
        throw new ApiError('ช่วงเวลานี้เต็มแล้ว', 409, 'SLOT_FULL');
      }
      const bookingCode = await generateBookingCode(tx);
      const queueNumber = `A${String(booked + 1).padStart(3, '0')}`;
      return tx.reserve.create({
        data: {
          bookingCode,
          userId: patient.id,
          hospitalId: body.hospitalId,
          scheduleId: slot.id,
          date: body.date,
          purpose: body.purpose,
          reason: body.reason,
          status: 'confirmed',
          queueNumber,
        },
        include: RESERVE_INCLUDE,
      });
    });

    return toAppointmentDto(reserve);
  }

  async updateReserveStatus(
    key: AuthenticatedHospitalKey,
    id: string,
    status: HospitalReserveStatus,
  ): Promise<Appointment> {
    const reserve = await this.prisma.reserve.findUnique({ where: { id } });
    if (!reserve) throw new ApiError('ไม่พบการจองนี้', 404, 'RESERVE_NOT_FOUND');
    if (reserve.hospitalId !== key.hospitalId) {
      throw new ApiError(
        'API key ไม่มีสิทธิ์แก้ไขการจองของโรงพยาบาลอื่น',
        403,
        'HOSPITAL_MISMATCH',
      );
    }

    const updated = await this.prisma.reserve.update({
      where: { id },
      data: { status },
      include: RESERVE_INCLUDE,
    });

    return toAppointmentDto(updated);
  }
}
