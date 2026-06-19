import { z } from 'zod';
import { isThaiNationalId } from '../../../shared/nationalId.js';

const serviceType = z.enum(['opd','new_patient','checkup','follow_up','lab','medication','elderly']);
const sex = z.enum(['male','female','unspecified']);
const insuranceRight = z.enum(['uc','sso','csmbs','self_pay']);
const zone = z.enum(['inner','north','south','east','thon_north','thon_south']);

export const loginSchema = z.object({
  nationalId: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'),
});

export const registerSchema = z.object({
  nationalId: z
    .string()
    .regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก')
    .refine(isThaiNationalId, 'เลขบัตรประจำตัวประชาชนไม่ถูกต้อง'),
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
});

export const createAppointmentSchema = z.object({
  hospitalId: z.string().min(1),
  purpose: serviceType,
  reason: z.string().default(''),
  slotId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const driveUrl = z
  .string()
  .trim()
  .regex(
    /^https?:\/\/(?:drive|docs)\.google\.com\/[^\s]+$/i,
    'ลิงก์ต้องเป็น https://drive.google.com/... หรือ https://docs.google.com/...',
  );

export const apiKeyRequestFormSchema = z.object({
  organizationName: z.string().trim().min(2, 'กรุณาระบุชื่อโรงพยาบาล/หน่วยงาน'),
  staffFullName: z.string().trim().min(2, 'กรุณาระบุชื่อ-นามสกุลเจ้าหน้าที่'),
  position: z.string().trim().min(2, 'กรุณาระบุตำแหน่ง/แผนก'),
  organizationEmail: z
    .string()
    .trim()
    .email('อีเมลหน่วยงานไม่ถูกต้อง')
    .refine(
      (v) => !/@(gmail|hotmail|outlook|yahoo|icloud|live)\.com$/i.test(v),
      'กรุณาใช้อีเมลของหน่วยงาน (ไม่ใช่อีเมลส่วนตัว)',
    ),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, 'เบอร์โทรไม่ถูกต้อง'),
  purpose: z.string().trim().min(10, 'กรุณาระบุวัตถุประสงค์โดยละเอียด (อย่างน้อย 10 ตัวอักษร)'),
  driveLinks: z
    .array(driveUrl)
    .min(1, 'กรุณาวางลิงก์ Google Drive อย่างน้อย 1 รายการ')
    .max(10, 'แนบลิงก์ได้สูงสุด 10 รายการต่อคำขอ'),
});
