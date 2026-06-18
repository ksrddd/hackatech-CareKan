import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.test', override: true });

import { buildApp } from '../app.js';
import type { PrismaClient } from '@prisma/client';

export function makeTestApp() {
  return buildApp();
}

export async function resetDb(prisma: PrismaClient): Promise<void> {
  // Order matters: children before parents.
  await prisma.reserve.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.hospitalApiKey.deleteMany();
}
