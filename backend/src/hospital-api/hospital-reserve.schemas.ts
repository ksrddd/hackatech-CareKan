import { z } from 'zod';

const serviceType = z.enum([
  'opd', 'new_patient', 'checkup', 'follow_up', 'lab', 'medication', 'elderly',
]);

export const createHospitalReserveSchema = z.object({
  patientNationalId: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  hospitalId: z.string().min(1),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purpose: serviceType,
  reason: z.string().default(''),
});

export const reserveStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
});

export type CreateHospitalReserveInput = z.infer<typeof createHospitalReserveSchema>;
export type HospitalReserveStatus = z.infer<typeof reserveStatusSchema>['status'];
