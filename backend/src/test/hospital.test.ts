import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
beforeAll(async () => { await resetDb(prisma); await runSeed(prisma); });

describe('hospitals', () => {
  it('lists all 45 hospitals', async () => {
    const res = await request(app).get('/api/hospitals');
    expect(res.status).toBe(200);
    expect(res.body.hospitals).toHaveLength(45);
  });

  it('filters by zone', async () => {
    const res = await request(app).get('/api/hospitals?zone=inner');
    expect(res.status).toBe(200);
    expect(res.body.hospitals.every((h: { zone: string }) => h.zone === 'inner')).toBe(true);
  });

  it('returns hospital detail without clinics array', async () => {
    const res = await request(app).get('/api/hospitals/klang');
    expect(res.status).toBe(200);
    expect(res.body.hospital.id).toBe('klang');
    expect(res.body.clinics).toBeUndefined();
  });

  it('404s an unknown hospital', async () => {
    const res = await request(app).get('/api/hospitals/nope');
    expect(res.status).toBe(404);
  });

  it('returns time slots for a hospital and date', async () => {
    const slot = await prisma.schedule.findFirst({ orderBy: { startTime: 'asc' } });
    if (!slot) throw new Error('No schedule slots found');
    // Find a date that matches the slot's dayOfWeek
    const today = new Date();
    let testDate = new Date(today);
    while (testDate.getDay() !== slot.dayOfWeek) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const slotDate = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;
    const res = await request(app).get(`/api/hospitals/klang/time-slots?date=${slotDate}`);
    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);
    expect(res.body.slots[0]).toHaveProperty('capacity');
  });
});
