// Typed endpoint functions. ONE place where path strings live; every
// feature imports `api.<thing>(...)` instead of writing fetch.

import type {
  AdminQueueQuery,
  AdminQueueResponse,
  AppointmentResponse,
  CreateAppointmentRequest,
  HospitalDetailResponse,
  HospitalsQuery,
  HospitalsResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  MyAppointmentsResponse,
  RegisterRequest,
  RegisterResponse,
  TimeSlotsQuery,
  TimeSlotsResponse,
  UpdateStatusRequest,
} from '../../../../shared/api';
import { apiFetch } from './client';

export const api = {
  login: (body: LoginRequest, signal?: AbortSignal) =>
    apiFetch<LoginResponse, LoginRequest>({
      method: 'POST',
      path: '/auth/login',
      body,
      signal,
    }),

  register: (body: RegisterRequest, signal?: AbortSignal) =>
    apiFetch<RegisterResponse, RegisterRequest>({
      method: 'POST',
      path: '/auth/register',
      body,
      signal,
    }),

  logout: (signal?: AbortSignal) =>
    apiFetch<void>({ method: 'POST', path: '/auth/logout', signal }),

  me: (signal?: AbortSignal) =>
    apiFetch<MeResponse>({ method: 'GET', path: '/auth/me', signal }),

  listHospitals: (q: HospitalsQuery, signal?: AbortSignal) =>
    apiFetch<HospitalsResponse>({
      method: 'GET',
      path: '/hospitals',
      query: q,
      signal,
    }),

  getHospital: (id: string, signal?: AbortSignal) =>
    apiFetch<HospitalDetailResponse>({
      method: 'GET',
      path: `/hospitals/${encodeURIComponent(id)}`,
      signal,
    }),

  listTimeSlots: (hospitalId: string, q: TimeSlotsQuery, signal?: AbortSignal) =>
    apiFetch<TimeSlotsResponse>({
      method: 'GET',
      path: `/hospitals/${encodeURIComponent(hospitalId)}/time-slots`,
      query: q,
      signal,
    }),

  createAppointment: (
    body: CreateAppointmentRequest,
    signal?: AbortSignal,
  ) =>
    apiFetch<AppointmentResponse, CreateAppointmentRequest>({
      method: 'POST',
      path: '/appointments',
      body,
      signal,
    }),

  getMyAppointments: (signal?: AbortSignal) =>
    apiFetch<MyAppointmentsResponse>({
      method: 'GET',
      path: '/appointments/me',
      signal,
    }),

  getAppointment: (id: string, signal?: AbortSignal) =>
    apiFetch<AppointmentResponse>({
      method: 'GET',
      path: `/appointments/${encodeURIComponent(id)}`,
      signal,
    }),

  getAdminQueue: (q: AdminQueueQuery, signal?: AbortSignal) =>
    apiFetch<AdminQueueResponse>({
      method: 'GET',
      path: '/admin/queue',
      query: q,
      signal,
    }),

  updateAppointmentStatus: (
    id: string,
    body: UpdateStatusRequest,
    signal?: AbortSignal,
  ) =>
    apiFetch<AppointmentResponse, UpdateStatusRequest>({
      method: 'PATCH',
      path: `/admin/appointments/${encodeURIComponent(id)}/status`,
      body,
      signal,
    }),
};
