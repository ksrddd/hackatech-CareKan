import type {
  User as UserRow, Hospital as HospitalRow, Schedule as ScheduleRow,
  Reserve as ReserveRow,
} from '@prisma/client';
import type { User, Hospital, TimeSlot, Appointment } from '../../../shared/types';

export function toUserDto(u: UserRow): User {
  return {
    id: u.id,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    nationalId: u.nationalId,
    birthDate: u.birthDate,
    sex: u.sex,
    phone: u.phoneNumber,
    email: u.email,
    consentAt: u.consentAt ? u.consentAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toHospitalDto(h: HospitalRow): Hospital {
  return {
    id: h.id, code: h.code, name: h.name, shortName: h.shortName,
    address: h.address, district: h.district, zone: h.zone, phone: h.phone,
    openingHours: h.openingHours, services: h.services, rightsAccepted: h.rightsAccepted,
    mockDistanceKm: h.mockDistanceKm, description: h.description,
  };
}

export function toTimeSlotDto(
  s: Pick<ScheduleRow, 'id' | 'startTime' | 'endTime' | 'maxCapacity'>,
  hospitalId: string,
  date: string,
  booked: number,
): TimeSlot {
  return {
    id: s.id, hospitalId, date,
    startTime: s.startTime, endTime: s.endTime,
    capacity: s.maxCapacity, booked,
  };
}

export function toAppointmentDto(
  r: ReserveRow & { schedule: ScheduleRow; user: Pick<UserRow, 'firstName' | 'lastName'> },
): Appointment {
  return {
    id: r.id,
    bookingRef: r.bookingCode,
    userId: r.userId,
    userFullName: `${r.user.firstName} ${r.user.lastName}`.trim(),
    hospitalId: r.hospitalId,
    purpose: r.purpose,
    reason: r.reason,
    date: r.date,
    startTime: r.schedule.startTime,
    endTime: r.schedule.endTime,
    queueNumber: r.queueNumber,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}
