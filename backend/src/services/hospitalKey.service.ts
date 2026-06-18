import { createHash } from 'node:crypto';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';

const KEY_PREFIX = 'ck_live_';

export interface AuthenticatedHospitalKey {
  id: string;
  organizationName: string;
  hospitalId: string;
  scope: string;
}

export async function authenticateHospitalKey(
  plaintext: string,
): Promise<AuthenticatedHospitalKey> {
  if (!plaintext.startsWith(KEY_PREFIX)) {
    throw new ApiError('API key ไม่ถูกต้อง', 401, 'INVALID_API_KEY');
  }
  const hash = createHash('sha256').update(plaintext).digest('hex');
  const row = await prisma.hospitalApiKey.findUnique({ where: { hash } });
  if (!row) throw new ApiError('API key ไม่ถูกต้อง', 401, 'INVALID_API_KEY');
  if (row.revokedAt) throw new ApiError('API key ถูกเพิกถอนแล้ว', 401, 'KEY_REVOKED');

  // Fire-and-forget: update lastUsedAt without blocking the request.
  void prisma.hospitalApiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    id: row.id,
    organizationName: row.organizationName,
    hospitalId: row.hospitalId,
    scope: row.scope,
  };
}
