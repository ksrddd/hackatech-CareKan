import { useQuery, useRequest } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { CreateAppointmentRequest } from '../../../shared/api';

export function useMyAppointments() {
  return useQuery((signal) => api.getMyAppointments(signal), []);
}

export function useAppointment(id: string) {
  return useQuery((signal) => api.getAppointment(id, signal).then((r) => r.appointment), [id]);
}

export function useQrAppointment(id: string | undefined) {
  return useQuery(
    (signal) => {
      // ป้องกันกรณีไม่มี id ส่งเข้ามา
      if (!id) return Promise.reject("No ID provided");
      return api.getQrAppointment(id, signal).then((r) => r.appointment);
    },
    [id] // เฝ้าดูการเปลี่ยนแปลงของ id
  );
}

export function useCreateAppointment() {
  return useRequest((signal, input: CreateAppointmentRequest) =>
    api.createAppointment(input, signal).then((r) => r.appointment),
  );
}
