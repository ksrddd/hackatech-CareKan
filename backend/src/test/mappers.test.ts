import { describe, it, expect } from 'vitest';
import { toUserDto, toTimeSlotDto } from '../mappers/mappers.js';

describe('mappers', () => {
  it('maps a user row to the User DTO (camelCase, fullName joined)', () => {
    const dto = toUserDto({
      id: 'u1', nationalId: '1234567890123',
      firstName: 'สมพร', lastName: 'ชัยพัฒน์', phoneNumber: '0812345678',
      email: 'a@b.c', password: 'hash',
      birthDate: '1958-04-12', sex: 'female',
      consentAt: new Date('2026-01-01'), createdAt: new Date('2026-01-01'),
    });
    expect(dto.fullName).toBe('สมพร ชัยพัฒน์');
    expect(dto.phone).toBe('0812345678');
    expect('password' in dto).toBe(false);
  });

  it('maps a schedule row to TimeSlot DTO', () => {
    const dto = toTimeSlotDto(
      { id: 's1', startTime: '09:00', endTime: '09:30', maxCapacity: 6 },
      'klang',
      '2026-06-23',
      2,
    );
    expect(dto).toMatchObject({ id: 's1', hospitalId: 'klang', date: '2026-06-23', capacity: 6, booked: 2 });
  });
});
