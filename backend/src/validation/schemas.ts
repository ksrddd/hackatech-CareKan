import { z } from 'zod';
import { isThaiNationalId } from '../../../shared/nationalId';
import { config } from '../config.js';

const serviceType = z.enum(['opd','new_patient','checkup','follow_up','lab','medication','elderly']);
const clinicCode = z.enum(['med','surg','ped','ob','ortho','eye','ent','dent','skin','ncd','psych']);
const sex = z.enum(['male','female','unspecified']);
const insuranceRight = z.enum(['uc','sso','csmbs','self_pay']);
const status = z.enum(['pending','confirmed','checked_in','in_progress','completed','cancelled','no_show']);
const zone = z.enum(['inner','north','south','east','thon_north','thon_south']);

export const loginSchema = z.object({
  nationalId: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'),
});

export const registerSchema = z.object({
  // 13-digit format always; the official checksum only when STRICT_NATIONAL_ID
  // is enabled (production), so the demo's fixed IDs still register.
  nationalId: z
    .string()
    .regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก')
    .refine(
      (v) => !config.strictNationalId || isThaiNationalId(v),
      'เลขบัตรประจำตัวประชาชนไม่ถูกต้อง',
    ),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
  sex,
  phone: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
  acceptedPdpaAt: z.string().min(1),
});

export const hospitalsQuerySchema = z.object({
  q: z.string().optional(),
  district: z.string().optional(),
  zone: zone.optional(),
  service: serviceType.optional(),
  right: insuranceRight.optional(),
});

export const timeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clinic: clinicCode,
});

export const createAppointmentSchema = z.object({
  hospitalId: z.string().min(1),
  clinic: clinicCode,
  purpose: serviceType,
  reason: z.string().default(''),
  slotId: z.string().min(1),
});

export const adminQuerySchema = z.object({
  hospitalId: z.string().min(1),
  clinic: clinicCode.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateStatusSchema = z.object({ status });
