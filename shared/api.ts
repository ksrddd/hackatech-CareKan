// CareKan — wire contracts (HTTP request/response shapes).
// Keep in lock-step with backend route handlers. Adding a field here
// without implementing it server-side is the #1 hackathon bug.

import type {
  Appointment,
  AppointmentStatus,
  ClinicCode,
  Hospital,
  InsuranceRight,
  Role,
  ServiceType,
  Sex,
  TimeSlot,
  User,
} from './types';

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// ─── Auth ──────────────────────────────────────────────────────────

export interface LoginRequest {
  nationalId: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface RegisterRequest {
  nationalId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: Sex;
  phone: string;
  email: string;
  password: string;
  acceptedPdpaAt: string;
}

export type RegisterResponse = LoginResponse;

export interface MeResponse {
  user: User;
}

// ─── Hospitals ─────────────────────────────────────────────────────

export interface HospitalsQuery {
  q?: string;
  district?: string;
  zone?: string;
  service?: ServiceType;
  right?: InsuranceRight;
}

export interface HospitalsResponse {
  hospitals: Hospital[];
}

export interface HospitalDetailResponse {
  hospital: Hospital;
  clinics: ClinicCode[];
}

// ─── Time slots ────────────────────────────────────────────────────

export interface TimeSlotsQuery {
  date: string;
  clinic: ClinicCode;
}

export interface TimeSlotsResponse {
  slots: TimeSlot[];
}

// ─── Appointments ──────────────────────────────────────────────────

export interface CreateAppointmentRequest {
  hospitalId: string;
  clinic: ClinicCode;
  purpose: ServiceType;
  reason: string;
  slotId: string;
}

export interface AppointmentResponse {
  appointment: Appointment;
}

export interface MyAppointmentsResponse {
  upcoming: Appointment[];
  history: Appointment[];
}

// ─── Admin ─────────────────────────────────────────────────────────

export interface AdminQueueQuery {
  hospitalId: string;
  clinic?: ClinicCode;
  date: string;
}

export interface AdminQueueResponse {
  appointments: Appointment[];
}

export interface UpdateStatusRequest {
  status: AppointmentStatus;
}

// ─── Helper: route → role gate ─────────────────────────────────────
// Useful on the backend to wire RBAC middleware tablewise.

export const ROUTE_ROLES: Record<string, Role | 'public'> = {
  'POST /auth/login': 'public',
  'POST /auth/register': 'public',
  'POST /auth/logout': 'public',
  'GET /auth/me': 'citizen',
  'GET /hospitals': 'public',
  'GET /hospitals/:id': 'public',
  'GET /hospitals/:id/time-slots': 'public',
  'POST /appointments': 'citizen',
  'GET /appointments/me': 'citizen',
  'GET /appointments/:id': 'citizen',
  'GET /admin/queue': 'admin',
  'PATCH /admin/appointments/:id/status': 'admin',
};
