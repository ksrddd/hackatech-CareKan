import 'dotenv/config';
import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';

const { values } = parseArgs({
  options: { prefix: { type: 'string' } },
});

if (!values['prefix']) {
  console.error('Usage: npx tsx scripts/revoke-key.ts --prefix=ck_live_AbCdEf');
  process.exit(1);
}

const prefix = values['prefix'];
const prisma = new PrismaClient();

const key = await prisma.hospitalApiKey.findFirst({ where: { prefix } });
if (!key) {
  console.error(`No key found with prefix: ${prefix}`);
  await prisma.$disconnect();
  process.exit(1);
}
if (key.revokedAt) {
  console.log(`Key ${prefix} is already revoked (${key.revokedAt.toISOString()})`);
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.hospitalApiKey.update({
  where: { id: key.id },
  data: { revokedAt: new Date() },
});
await prisma.$disconnect();

console.log(`✓ Key ${prefix} (${key.organizationName}) has been revoked.`);
