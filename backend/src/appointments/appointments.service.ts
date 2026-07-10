import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateAppointmentRequest } from '../../../shared/api';
import { ApiError } from '../common/errors/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toAppointmentDto } from '../services/mappers.js';

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
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(userId: string, input: CreateAppointmentRequest) {
    const reserve = await this.prisma.$transaction(async (tx) => {
      const slot = await tx.schedule.findUnique({ where: { id: input.slotId } });
      if (!slot) throw new ApiError('ไม่พบช่วงเวลานี้', 404, 'SLOT_NOT_FOUND');
      const dayOfWeek = new Date(input.date + 'T00:00:00').getDay();
      if (slot.dayOfWeek !== dayOfWeek) {
        throw new ApiError('วันที่ไม่ตรงกับตารางเวลา', 400, 'DATE_MISMATCH');
      }
      const booked = await tx.reserve.count({
        where: { hospitalId: input.hospitalId, scheduleId: slot.id, date: input.date },
      });
      if (booked >= slot.maxCapacity) {
        throw new ApiError('ช่วงเวลานี้เต็มแล้ว', 409, 'SLOT_FULL');
      }
      const bookingCode = await generateBookingCode(tx);
      const queueNumber = `A${String(booked + 1).padStart(3, '0')}`;
      return tx.reserve.create({
        data: {
          bookingCode, userId, hospitalId: input.hospitalId, scheduleId: slot.id,
          date: input.date,
          purpose: input.purpose, reason: input.reason, status: 'confirmed',
          queueNumber,
        },
        include: RESERVE_INCLUDE,
      });
    });
    return toAppointmentDto(reserve);
  }

  async getMyAppointments(userId: string) {
    const rows = await this.prisma.reserve.findMany({
      where: { userId }, include: RESERVE_INCLUDE,
      orderBy: [{ date: 'asc' }, { schedule: { startTime: 'asc' } }],
    });
    const today = new Date().toISOString().slice(0, 10);
    const terminal = new Set(['completed', 'cancelled', 'no_show']);
    const dtos = rows.map(toAppointmentDto);
    return {
      upcoming: dtos.filter((a) => !terminal.has(a.status) && a.date >= today),
      history: dtos.filter((a) => terminal.has(a.status) || a.date < today),
    };
  }

  async getAppointmentForOwner(id: string, userId: string) {
    const r = await this.prisma.reserve.findUnique({ where: { id }, include: RESERVE_INCLUDE });
    if (!r || r.userId !== userId) throw new ApiError('ไม่พบนัดหมาย', 404, 'NOT_FOUND');
    return toAppointmentDto(r);
  }

  async getQrAppointment(id: string) {
    const r = await this.prisma.reserve.findUnique({ where: { id }, include: RESERVE_INCLUDE });
    if (!r) throw new ApiError('ไม่พบนัดหมาย', 404, 'NOT_FOUND');
    return toAppointmentDto(r);
  }
}
