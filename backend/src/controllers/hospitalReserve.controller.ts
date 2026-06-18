import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';
import { toAppointmentDto } from '../services/mappers.js';

const serviceType = z.enum([
  'opd', 'new_patient', 'checkup', 'follow_up', 'lab', 'medication', 'elderly',
]);

const createSchema = z.object({
  patientNationalId: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  hospitalId: z.string().min(1),
  scheduleId: z.string().min(1),
  purpose: serviceType,
  reason: z.string().default(''),
});

const statusSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
});

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

export async function createReserve(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const hospitalKey = req.hospitalKey!;

  if (body.hospitalId !== hospitalKey.hospitalId) {
    throw new ApiError(
      'API key ไม่มีสิทธิ์สร้างการจองสำหรับโรงพยาบาลนี้',
      403,
      'HOSPITAL_MISMATCH',
    );
  }

  const patient = await prisma.user.findUnique({
    where: { nationalId: body.patientNationalId },
  });
  if (!patient) throw new ApiError('ไม่พบข้อมูลผู้ป่วย', 404, 'PATIENT_NOT_FOUND');

  const reserve = await prisma.$transaction(async (tx) => {
    const slot = await tx.schedule.findUnique({ where: { id: body.scheduleId } });
    if (!slot || slot.hospitalId !== body.hospitalId) {
      throw new ApiError('ไม่พบช่วงเวลานี้', 404, 'SLOT_NOT_FOUND');
    }
    if (slot.isFull || slot.currentBooked >= slot.maxCapacity) {
      throw new ApiError('ช่วงเวลานี้เต็มแล้ว', 409, 'SLOT_FULL');
    }
    const bookingCode = await generateBookingCode(tx);
    const willBeFull = slot.currentBooked + 1 >= slot.maxCapacity;
    const updatedSlot = await tx.schedule.update({
      where: { id: slot.id },
      data: { currentBooked: { increment: 1 }, isFull: willBeFull },
    });
    const queueNumber = `A${String(updatedSlot.currentBooked).padStart(3, '0')}`;
    return tx.reserve.create({
      data: {
        bookingCode,
        userId: patient.id,
        hospitalId: slot.hospitalId,
        scheduleId: slot.id,
        purpose: body.purpose,
        reason: body.reason,
        status: 'confirmed',
        queueNumber,
      },
      include: RESERVE_INCLUDE,
    });
  });

  res.status(201).json({ appointment: toAppointmentDto(reserve) });
}

export async function updateReserveStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = statusSchema.parse(req.body);
  const hospitalKey = req.hospitalKey!;

  const reserve = await prisma.reserve.findUnique({ where: { id } });
  if (!reserve) throw new ApiError('ไม่พบการจองนี้', 404, 'RESERVE_NOT_FOUND');
  if (reserve.hospitalId !== hospitalKey.hospitalId) {
    throw new ApiError(
      'API key ไม่มีสิทธิ์แก้ไขการจองของโรงพยาบาลอื่น',
      403,
      'HOSPITAL_MISMATCH',
    );
  }

  const updated = await prisma.reserve.update({
    where: { id },
    data: { status },
    include: RESERVE_INCLUDE,
  });

  res.json({ appointment: toAppointmentDto(updated) });
}
