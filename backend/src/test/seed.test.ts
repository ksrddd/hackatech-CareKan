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

  it('creates 45 hospitals', async () => {
    expect(await prisma.hospital.count()).toBe(45);
  });

  it('creates the demo citizen with national id 1234567890123', async () => {
    const u = await prisma.user.findUnique({ where: { nationalId: '1234567890123' } });
    expect(u).not.toBeNull();
  });

  it('creates 70 shared schedule template slots (5 weekdays × 14 time slots)', async () => {
    expect(await prisma.schedule.count()).toBe(70);
  });

  it('all reserves have a date field', async () => {
    const reserves = await prisma.reserve.findMany();
    for (const r of reserves) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
