import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
let token: string;
let openSlotId: string;

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);
  const login = await request(app).post('/api/auth/login')
    .send({ nationalId: '1234567890123', password: 'care1234' });
  token = login.body.token;
  const slot = await prisma.schedule.findFirst({
    where: { hospitalId: 'klang', clinic: 'med', currentBooked: { lt: 6 } },
    orderBy: { date: 'asc' },
  });
  openSlotId = slot!.id;
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
      .send({ hospitalId: 'klang', clinic: 'med', purpose: 'follow_up', reason: 'นัดติดตาม', slotId: openSlotId });
    expect(res.status).toBe(201);
    expect(res.body.appointment.bookingRef).toMatch(/^CK-[A-Z0-9]{6}$/);
    expect(res.body.appointment.queueNumber).toMatch(/^A\d{3}$/);
    expect(res.body.appointment.status).toBe('confirmed');
  });

  it('increments the slot booked count', async () => {
    const slot = await prisma.schedule.findUnique({ where: { id: openSlotId } });
    expect(slot!.currentBooked).toBeGreaterThanOrEqual(1);
  });

  it('rejects booking a full slot with 409', async () => {
    const full = await prisma.schedule.create({
      data: { hospitalId: 'klang', clinic: 'med', date: '2030-01-01', startTime: '08:00', endTime: '08:30', maxCapacity: 1, currentBooked: 1, isFull: true },
    });
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: 'klang', clinic: 'med', purpose: 'opd', reason: 'x', slotId: full.id });
    expect(res.status).toBe(409);
  });

  it("blocks reading another user's appointment (PDPA) with 404", async () => {
    // create a second user + their appointment
    await request(app).post('/api/auth/register').send({
      nationalId: '2222222222228', firstName: 'อื่น', lastName: 'คน', birthDate: '1990-01-01',
      sex: 'male', phone: '0800000001', email: 'other@example.com', password: 'pass1234',
      acceptedPdpaAt: new Date().toISOString(),
    });
    const otherLogin = await request(app).post('/api/auth/login').send({ nationalId: '2222222222228', password: 'pass1234' });
    const slot2 = await prisma.schedule.findFirst({ where: { hospitalId: 'taksin', clinic: 'med', currentBooked: { lt: 6 } } });
    const created = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${otherLogin.body.token}`)
      .send({ hospitalId: 'taksin', clinic: 'med', purpose: 'opd', reason: 'y', slotId: slot2!.id });
    const otherId = created.body.appointment.id;
    // citizen #1 tries to read it
    const res = await request(app).get(`/api/appointments/${otherId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
