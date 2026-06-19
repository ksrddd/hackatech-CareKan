import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();

const KEY_PREFIX = 'ck_live_';
function makeKey() {
  const raw = randomBytes(32).toString('base64url');
  const plaintext = `${KEY_PREFIX}${raw}`;
  const prefix = plaintext.slice(0, KEY_PREFIX.length + 6);
  const hash = createHash('sha256').update(plaintext).digest('hex');
  return { plaintext, prefix, hash };
}

function nextDateForDayOfWeek(dayOfWeek: number, daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let hospitalId: string;
let plaintext: string;
let scheduleId: string;
let scheduleDate: string;
let patientNationalId: string;

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);

  const hosp = await prisma.hospital.findFirst({ where: { id: 'klang' } });
  hospitalId = hosp!.id;

  // Pick any schedule slot and compute a matching future date
  const slot = await prisma.schedule.findFirst({ orderBy: { startTime: 'asc' } });
  scheduleId = slot!.id;
  scheduleDate = nextDateForDayOfWeek(slot!.dayOfWeek);

  const patient = await prisma.user.findFirst({ where: { nationalId: '1234567890123' } });
  patientNationalId = patient!.nationalId;

  const k = makeKey();
  plaintext = k.plaintext;
  await prisma.hospitalApiKey.create({
    data: {
      organizationName: 'Test Hospital System',
      hospitalId,
      prefix: k.prefix,
      hash: k.hash,
      scope: 'hospital_write',
    },
  });
});

describe('POST /hospital/reserves — hospital key auth', () => {
  it('rejects missing key with 401', async () => {
    const res = await request(app).post('/api/hospital/reserves').send({});
    expect(res.status).toBe(401);
  });

  it('rejects invalid key with 401', async () => {
    const res = await request(app)
      .post('/api/hospital/reserves')
      .set('x-api-key', 'ck_live_notreal')
      .send({});
    expect(res.status).toBe(401);
  });

  it('rejects wrong hospitalId with 403', async () => {
    const wrongHosp = await prisma.hospital.findFirst({ where: { NOT: { id: hospitalId } } });
    const res = await request(app)
      .post('/api/hospital/reserves')
      .set('x-api-key', plaintext)
      .send({
        patientNationalId,
        hospitalId: wrongHosp!.id,
        scheduleId,
        date: scheduleDate,
        purpose: 'opd',
      });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('HOSPITAL_MISMATCH');
  });

  it('rejects unknown patient with 404', async () => {
    const res = await request(app)
      .post('/api/hospital/reserves')
      .set('x-api-key', plaintext)
      .send({
        patientNationalId: '9999999999999',
        hospitalId,
        scheduleId,
        date: scheduleDate,
        purpose: 'opd',
      });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PATIENT_NOT_FOUND');
  });

  it('creates a booking and returns appointment DTO', async () => {
    const res = await request(app)
      .post('/api/hospital/reserves')
      .set('x-api-key', plaintext)
      .send({
        patientNationalId,
        hospitalId,
        scheduleId,
        date: scheduleDate,
        purpose: 'follow_up',
        reason: 'hospital system integration',
      });
    expect(res.status).toBe(201);
    expect(res.body.appointment.bookingRef).toMatch(/^CK-[A-Z0-9]{6}$/);
    expect(res.body.appointment.status).toBe('confirmed');
  });
});

describe('PATCH /hospital/reserves/:id/status', () => {
  let reserveId: string;

  beforeAll(async () => {
    const slot2 = await prisma.schedule.findFirst({ where: { id: { not: scheduleId } } });
    const slot2Date = nextDateForDayOfWeek(slot2!.dayOfWeek, 8);
    const res = await request(app)
      .post('/api/hospital/reserves')
      .set('x-api-key', plaintext)
      .send({
        patientNationalId,
        hospitalId,
        scheduleId: slot2!.id,
        date: slot2Date,
        purpose: 'checkup',
      });
    reserveId = res.body.appointment.id as string;
  });

  it('rejects missing key with 401', async () => {
    const res = await request(app).patch(`/api/hospital/reserves/${reserveId}/status`).send({ status: 'completed' });
    expect(res.status).toBe(401);
  });

  it('rejects cross-hospital update with 403', async () => {
    const otherHosp = await prisma.hospital.findFirst({ where: { NOT: { id: hospitalId } } });
    const k2 = makeKey();
    await prisma.hospitalApiKey.create({
      data: {
        organizationName: 'Other Hospital',
        hospitalId: otherHosp!.id,
        prefix: k2.prefix,
        hash: k2.hash,
        scope: 'hospital_write',
      },
    });
    const res = await request(app)
      .patch(`/api/hospital/reserves/${reserveId}/status`)
      .set('x-api-key', k2.plaintext)
      .send({ status: 'completed' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('HOSPITAL_MISMATCH');
  });

  it('sets status to completed', async () => {
    const res = await request(app)
      .patch(`/api/hospital/reserves/${reserveId}/status`)
      .set('x-api-key', plaintext)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('completed');
  });

  it('rejects invalid status with 400', async () => {
    const res = await request(app)
      .patch(`/api/hospital/reserves/${reserveId}/status`)
      .set('x-api-key', plaintext)
      .send({ status: 'pending' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown reserve', async () => {
    const res = await request(app)
      .patch(`/api/hospital/reserves/nonexistent/status`)
      .set('x-api-key', plaintext)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RESERVE_NOT_FOUND');
  });
});
