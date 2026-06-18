import { useQuery, useRequest } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { CreateAppointmentRequest } from '../../../shared/api';

export function useMyAppointments() {
  return useQuery((signal) => api.getMyAppointments(signal), []);
}

export function useAppointment(id: string) {
  return useQuery((signal) => api.getAppointment(id, signal).then((r) => r.appointment), [id]);
}

export function useCreateAppointment() {
  return useRequest((signal, input: CreateAppointmentRequest) =>
    api.createAppointment(input, signal).then((r) => r.appointment),
  );
}
