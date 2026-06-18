// CareKan — wire contracts (HTTP request/response shapes).
// Keep in lock-step with backend route handlers. Adding a field here
// without implementing it server-side is the #1 hackathon bug.

import type {
  ApiKeyDto,
  ApiKeyRequestDto,
  Appointment,
  ClinicCode,
  Hospital,
  InsuranceRight,
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
  token: string;
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

// ─── API key issuance ──────────────────────────────────────────────

export interface ApiKeyRequestForm {
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  referenceNumber?: string;
  purpose: string;
  driveLinks: string[];
}

export interface ApiKeyRequestSubmittedResponse {
  request: ApiKeyRequestDto;
  devVerificationUrl?: string;
}

export interface ApiKeyRequestsResponse {
  requests: ApiKeyRequestDto[];
}

export interface ApiKeyVerifyResponse {
  request: ApiKeyRequestDto;
  plaintextKey: string;
  apiKey: ApiKeyDto;
}

export interface ApiKeysResponse {
  apiKeys: ApiKeyDto[];
}

export interface ApiKeyResponse {
  apiKey: ApiKeyDto;
}

export interface ApiKeyRegenerateResponse {
  apiKey: ApiKeyDto;
  plaintextKey: string;
}

export interface QueueAllResponse {
  appointments: Appointment[];
}

