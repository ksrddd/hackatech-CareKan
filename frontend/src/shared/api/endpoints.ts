import type {
  ApiKeyRegenerateResponse,
  ApiKeyRequestForm,
  ApiKeyRequestSubmittedResponse,
  ApiKeyRequestsResponse,
  ApiKeyResponse,
  ApiKeyVerifyResponse,
  ApiKeysResponse,
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
} from '../../../../shared/api';
import { apiFetch, getAuthToken } from './client';

export const api = {
  login: (body: LoginRequest, signal?: AbortSignal) =>
    apiFetch<LoginResponse, LoginRequest>({ method: 'POST', path: '/auth/login', body, signal }),

  register: (body: RegisterRequest, signal?: AbortSignal) =>
    apiFetch<RegisterResponse, RegisterRequest>({ method: 'POST', path: '/auth/register', body, signal }),

  logout: (signal?: AbortSignal) =>
    apiFetch<void>({ method: 'POST', path: '/auth/logout', signal }),

  me: (signal?: AbortSignal) =>
    apiFetch<MeResponse>({ method: 'GET', path: '/auth/me', signal }),

  listHospitals: (q: HospitalsQuery, signal?: AbortSignal) =>
    apiFetch<HospitalsResponse>({ method: 'GET', path: '/hospitals', query: q, signal }),

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

  createAppointment: (body: CreateAppointmentRequest, signal?: AbortSignal) =>
    apiFetch<AppointmentResponse, CreateAppointmentRequest>({
      method: 'POST',
      path: '/appointments',
      body,
      signal,
    }),

  getMyAppointments: (signal?: AbortSignal) =>
    apiFetch<MyAppointmentsResponse>({ method: 'GET', path: '/appointments/me', signal }),

  getAppointment: (id: string, signal?: AbortSignal) =>
    apiFetch<AppointmentResponse>({
      method: 'GET',
      path: `/appointments/${encodeURIComponent(id)}`,
      signal,
    }),

  submitApiKeyRequest: (body: ApiKeyRequestForm, signal?: AbortSignal) =>
    apiFetch<ApiKeyRequestSubmittedResponse, ApiKeyRequestForm>({
      method: 'POST',
      path: '/api-keys/requests',
      body,
      signal,
    }),

  listMyApiKeyRequests: (signal?: AbortSignal) =>
    apiFetch<ApiKeyRequestsResponse>({ method: 'GET', path: '/api-keys/requests', signal }),

  verifyApiKeyEmail: (token: string, signal?: AbortSignal) =>
    apiFetch<ApiKeyVerifyResponse, { token: string }>({
      method: 'POST',
      path: '/api-keys/verify',
      body: { token },
      signal,
    }),

  listMyApiKeys: (signal?: AbortSignal) =>
    apiFetch<ApiKeysResponse>({ method: 'GET', path: '/api-keys', signal }),

  revokeApiKey: (id: string, signal?: AbortSignal) =>
    apiFetch<ApiKeyResponse>({
      method: 'POST',
      path: `/api-keys/${encodeURIComponent(id)}/revoke`,
      signal,
    }),

  regenerateApiKey: (id: string, signal?: AbortSignal) =>
    apiFetch<ApiKeyRegenerateResponse>({
      method: 'POST',
      path: `/api-keys/${encodeURIComponent(id)}/regenerate`,
      signal,
    }),

  // Download user's own request as Excel receipt — uses raw fetch because
  // the response is binary and we need the browser file-save dialog.
  downloadMyApiKeyRequestExcel: async (id: string): Promise<void> => {
    const token = getAuthToken();
    const res = await fetch(`/api/api-keys/requests/${encodeURIComponent(id)}/export`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(msg || 'ดาวน์โหลดไฟล์ไม่สำเร็จ');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-key-request-${id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
