import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runSeed } from '../../prisma/seed.js';
import { resetDb } from './helpers.js';

const prisma = new PrismaClient();

describe('seed', () => {
  beforeAll(async () => {
    await resetDb(prisma);
    await runSeed(prisma);
  });

  it('creates 9 hospitals', async () => {
    expect(await prisma.hospital.count()).toBe(9);
  });

  it('creates the demo citizen with national id 1234567890123', async () => {
    const u = await prisma.user.findUnique({ where: { nationalId: '1234567890123' } });
    expect(u?.role).toBe('citizen');
  });

  it('keeps schedule.currentBooked consistent with reserve count', async () => {
    const schedules = await prisma.schedule.findMany({ include: { reserves: true } });
    for (const s of schedules) {
      expect(s.currentBooked).toBeGreaterThanOrEqual(s.reserves.length);
    }
  });
});
