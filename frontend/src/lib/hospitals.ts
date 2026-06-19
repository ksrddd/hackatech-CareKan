import { useQuery } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { HospitalsQuery } from '../../../shared/api';

export function useHospitals(query: HospitalsQuery) {
  return useQuery(
    (signal) => api.listHospitals(query, signal).then((r) => r.hospitals),
    [query.q, query.district, query.zone, query.service, query.right],
  );
}

export function useHospital(id: string) {
  return useQuery((signal) => api.getHospital(id, signal), [id], id !== '');
}

export function useTimeSlots(hospitalId: string, date: string) {
  return useQuery(
    (signal) => api.listTimeSlots(hospitalId, { date }, signal).then((r) => r.slots),
    [hospitalId, date],
  );
}
