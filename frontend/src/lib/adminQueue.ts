import { useQuery, useRequest } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { AppointmentStatus, ClinicCode } from './types';

export function useAdminQueue(hospitalId: string, date: string, clinic?: ClinicCode) {
  return useQuery(
    (signal) => api.getAdminQueue({ hospitalId, date, clinic }, signal).then((r) => r.appointments),
    [hospitalId, date, clinic ?? ''],
  );
}

export function useUpdateStatus() {
  return useRequest((signal, id: string, status: AppointmentStatus) =>
    api.updateAppointmentStatus(id, { status }, signal).then((r) => r.appointment),
  );
}
