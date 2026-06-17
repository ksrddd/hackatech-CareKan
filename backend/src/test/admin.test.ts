import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
let adminToken: string;
let citizenToken: string;

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);
  adminToken = (await request(app).post('/api/auth/login').send({ nationalId: '9876543210987', password: 'care1234' })).body.token;
  citizenToken = (await request(app).post('/api/auth/login').send({ nationalId: '1234567890123', password: 'care1234' })).body.token;
});

describe('admin', () => {
  it('forbids a citizen from the admin queue (403)', async () => {
    const res = await request(app).get('/api/admin/queue?hospitalId=klang&date=2026-06-18').set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns the queue for a hospital/date', async () => {
    const seeded = await prisma.reserve.findFirst({ include: { schedule: true }, where: { hospitalId: 'klang' } });
    const date = seeded!.schedule.date;
    const res = await request(app).get(`/api/admin/queue?hospitalId=klang&date=${date}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.appointments)).toBe(true);
  });

  it('advances a status and sets checkedInAt on check-in', async () => {
    const r = await prisma.reserve.findFirst({ where: { status: 'confirmed' }, include: { schedule: true } });
    const res = await request(app).patch(`/api/admin/appointments/${r!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'checked_in' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('checked_in');
    expect(res.body.appointment.checkedInAt).toBeTruthy();
  });

  it('rejects an illegal transition (completed -> pending) with 400', async () => {
    const r = await prisma.reserve.findFirst({ where: { status: 'completed' }, include: { schedule: true } });
    const res = await request(app).patch(`/api/admin/appointments/${r!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'pending' });
    expect(res.status).toBe(400);
  });
});
