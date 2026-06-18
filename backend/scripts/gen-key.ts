import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';

const { values } = parseArgs({
  options: {
    org: { type: 'string' },
    'hospital-id': { type: 'string' },
  },
});

if (!values['org'] || !values['hospital-id']) {
  console.error(
    'Usage: npx tsx scripts/gen-key.ts --org="โรงพยาบาล X" --hospital-id="hosp_001"',
  );
  process.exit(1);
}

const org = values['org'];
const hospitalId = values['hospital-id'];

const KEY_PREFIX = 'ck_live_';
const raw = randomBytes(32).toString('base64url');
const plaintext = `${KEY_PREFIX}${raw}`;
const prefix = plaintext.slice(0, KEY_PREFIX.length + 6);
const hash = createHash('sha256').update(plaintext).digest('hex');

const prisma = new PrismaClient();

const key = await prisma.hospitalApiKey.create({
  data: { organizationName: org, hospitalId, prefix, hash, scope: 'hospital_write' },
});

await prisma.$disconnect();

console.log(`\n✓ Key created for: ${key.organizationName}`);
console.log(`  Hospital ID : ${key.hospitalId}`);
console.log(`  Prefix      : ${key.prefix}`);
console.log(`  Key         : ${plaintext}`);
console.log(`\n  ⚠ Send this key to the organization via email. It will NOT be shown again.\n`);
