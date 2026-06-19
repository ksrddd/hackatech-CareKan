import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
let token: string;
let openSlotId: string;
let openSlotDate: string;

function nextDateForDayOfWeek(dayOfWeek: number, daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);
  const login = await request(app).post('/api/auth/login')
    .send({ nationalId: '1234567890123', password: 'care1234' });
  token = login.body.token;
  const slot = await prisma.schedule.findFirst({ orderBy: { startTime: 'asc' } });
  openSlotId = slot!.id;
  openSlotDate = nextDateForDayOfWeek(slot!.dayOfWeek);
});

describe('appointments', () => {
  it('requires auth (401)', async () => {
    const res = await request(app).get('/api/appointments/me');
    expect(res.status).toBe(401);
  });

  it('returns my upcoming + history (seeded)', async () => {
    const res = await request(app).get('/api/appointments/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.upcoming.length).toBeGreaterThanOrEqual(1);
    expect(res.body.history.length).toBeGreaterThanOrEqual(1);
  });

  it('creates an appointment with a CK- ref and A0xx queue number', async () => {
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: 'klang', purpose: 'follow_up', reason: 'นัดติดตาม', slotId: openSlotId, date: openSlotDate });
    expect(res.status).toBe(201);
    expect(res.body.appointment.bookingRef).toMatch(/^CK-[A-Z0-9]{6}$/);
    expect(res.body.appointment.queueNumber).toMatch(/^A\d{3}$/);
    expect(res.body.appointment.status).toBe('confirmed');
  });

  it('increments the slot booked count', async () => {
    const count = await prisma.reserve.count({
      where: { scheduleId: openSlotId, hospitalId: 'klang', date: openSlotDate },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('rejects booking a full slot with 409', async () => {
    const fullSlot = await prisma.schedule.create({
      data: { dayOfWeek: 1, startTime: '07:00', endTime: '07:30', maxCapacity: 1 },
    });
    const monday = nextDateForDayOfWeek(1);
    const user = await prisma.user.findUnique({ where: { nationalId: '1234567890123' } });
    await prisma.reserve.create({
      data: {
        bookingCode: 'CK-FULLTEST', userId: user!.id, hospitalId: 'klang',
        scheduleId: fullSlot.id, date: monday,
        purpose: 'opd', reason: '', status: 'confirmed', queueNumber: 'A001',
      },
    });
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: 'klang', purpose: 'opd', reason: 'x', slotId: fullSlot.id, date: monday });
    expect(res.status).toBe(409);
  });

  it("blocks reading another user's appointment (PDPA) with 404", async () => {
    await request(app).post('/api/auth/register').send({
      nationalId: '3222222222225', firstName: 'อื่น', lastName: 'คน', birthDate: '1990-01-01',
      sex: 'male', phone: '0800000001', email: 'other@example.com', password: 'pass1234',
      acceptedPdpaAt: new Date().toISOString(),
    });
    const otherLogin = await request(app).post('/api/auth/login').send({ nationalId: '3222222222225', password: 'pass1234' });
    const slot2 = await prisma.schedule.findFirst({ where: { id: { not: openSlotId } } });
    const slot2Date = nextDateForDayOfWeek(slot2!.dayOfWeek, 8);
    const created = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${otherLogin.body.token}`)
      .send({ hospitalId: 'taksin', purpose: 'opd', reason: 'y', slotId: slot2!.id, date: slot2Date });
    const otherId = created.body.appointment.id;
    const res = await request(app).get(`/api/appointments/${otherId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
