import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('prisma schema', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it('can round-trip a hospital with enum array fields', async () => {
    const h = await prisma.hospital.create({
      data: {
        id: 'test-klang',
        code: 'TK',
        name: 'รพ.ทดสอบ',
        shortName: 'ทดสอบ',
        address: 'a',
        district: 'd',
        zone: 'inner',
        phone: '02',
        openingHours: 'x',
        description: 'y',
        services: ['opd', 'follow_up'],
        rightsAccepted: ['uc', 'sso'],
        mockDistanceKm: 1.2,
      },
    });
    expect(h.services).toEqual(['opd', 'follow_up']);
    await prisma.hospital.delete({ where: { id: 'test-klang' } });
  });
});
