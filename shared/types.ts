// CareKan — shared domain types
// Authoritative source for frontend AND backend. No React, no runtime deps.
// Both sides import from this file so the wire shapes stay in sync.

export type InsuranceRight = 'uc' | 'sso' | 'csmbs' | 'self_pay';

export const insuranceRightLabel: Record<InsuranceRight, string> = {
  uc: 'หลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
  sso: 'ประกันสังคม',
  csmbs: 'ข้าราชการ (CSMBS)',
  self_pay: 'ชำระเงินเอง',
};

export type Sex = 'male' | 'female' | 'unspecified';

export interface User {
  id: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  sex: Sex;
  phone: string;
  email: string;
  consentAt: string | null;
  createdAt: string;
}

export type ServiceType =
  | 'opd'
  | 'new_patient'
  | 'checkup'
  | 'follow_up'
  | 'lab'
  | 'medication'
  | 'elderly';

export const serviceTypeLabel: Record<ServiceType, string> = {
  opd: 'ตรวจรักษาทั่วไป (OPD)',
  new_patient: 'ทำบัตรผู้ป่วยใหม่',
  checkup: 'ตรวจสุขภาพประจำปี',
  follow_up: 'นัดติดตามอาการ',
  lab: 'ตรวจเลือด / Lab',
  medication: 'รับยาตามนัด',
  elderly: 'คลินิกผู้สูงอายุ',
};

export type Zone =
  | 'inner'
  | 'north'
  | 'south'
  | 'east'
  | 'thon_north'
  | 'thon_south';

export const zoneLabel: Record<Zone, string> = {
  inner: 'กรุงเทพชั้นใน',
  north: 'กรุงเทพเหนือ',
  south: 'กรุงเทพใต้',
  east: 'กรุงเทพตะวันออก',
  thon_north: 'กรุงธนเหนือ',
  thon_south: 'กรุงธนใต้',
};

export interface Hospital {
  id: string;
  code: string;
  name: string;
  shortName: string;
  address: string;
  district: string;
  zone: Zone;
  phone: string;
  openingHours: string;
  services: ServiceType[];
  rightsAccepted: InsuranceRight[];
  mockDistanceKm: number;
  description: string;
}

export type ClinicCode =
  | 'med'
  | 'surg'
  | 'ped'
  | 'ob'
  | 'ortho'
  | 'eye'
  | 'ent'
  | 'dent'
  | 'skin'
  | 'ncd'
  | 'psych';

export const clinicLabel: Record<ClinicCode, string> = {
  med: 'คลินิกอายุรกรรม',
  surg: 'คลินิกศัลยกรรม',
  ped: 'คลินิกกุมารเวชกรรม',
  ob: 'คลินิกสูตินรีเวช',
  ortho: 'คลินิกกระดูกและข้อ',
  eye: 'คลินิกตา',
  ent: 'คลินิกหู คอ จมูก',
  dent: 'คลินิกทันตกรรม',
  skin: 'คลินิกผิวหนัง',
  ncd: 'คลินิกโรคไม่ติดต่อเรื้อรัง (NCD)',
  psych: 'คลินิกจิตเวช',
};

export interface TimeSlot {
  id: string;
  hospitalId: string;
  clinic: ClinicCode;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  checked_in: 'เช็กอินแล้ว',
  in_progress: 'กำลังตรวจ',
  completed: 'เข้ารับบริการแล้ว',
  cancelled: 'ยกเลิก',
  no_show: 'ไม่มาตามนัด',
};

export interface Appointment {
  id: string;
  bookingRef: string;
  userId: string;
  userFullName: string;
  hospitalId: string;
  clinic: ClinicCode;
  purpose: ServiceType;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  queueNumber: string;
  status: AppointmentStatus;
  createdAt: string;
}

// ─── API key issuance ──────────────────────────────────────────────

export type ApiKeyRequestStatus =
  | 'pending_email'
  | 'email_verified'
  | 'approved'
  | 'rejected'
  | 'revoked';

export type ApiKeyScope = 'read_queue';

export interface ApiKeyRequestDto {
  id: string;
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  referenceNumber: string | null;
  purpose: string;
  driveLinks: string[];
  status: ApiKeyRequestStatus;
  rejectedReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface ApiKeyDto {
  id: string;
  prefix: string;
  scope: ApiKeyScope;
  organizationName: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}
