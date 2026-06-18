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

  it('returns hospital detail with clinics array', async () => {
    const res = await request(app).get('/api/hospitals/klang');
    expect(res.status).toBe(200);
    expect(res.body.hospital.id).toBe('klang');
    expect(Array.isArray(res.body.clinics)).toBe(true);
    expect(res.body.clinics).toContain('med');
  });

  it('404s an unknown hospital', async () => {
    const res = await request(app).get('/api/hospitals/nope');
    expect(res.status).toBe(404);
  });

  it('returns time slots for a hospital/clinic/date', async () => {
    const hosp = await request(app).get('/api/hospitals/klang');
    const slotDate = (await prisma.schedule.findFirst({
      where: { hospitalId: 'klang', clinic: 'med' }, orderBy: { date: 'asc' },
    }))!.date;
    const res = await request(app).get(`/api/hospitals/klang/time-slots?date=${slotDate}&clinic=med`);
    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);
    expect(res.body.slots[0]).toHaveProperty('capacity');
    expect(hosp.body.clinics).toContain('med');
  });
});
