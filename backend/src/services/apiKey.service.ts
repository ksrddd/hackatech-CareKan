import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as XLSX from 'xlsx';
import type { ApiKeyRequest, ApiKey } from '@prisma/client';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';
import type { ApiKeyDto, ApiKeyRequestDto } from '../../../shared/types';
import type { ApiKeyRequestFormInput } from '../validation/schemas.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'ck_live_';

export function toApiKeyRequestDto(r: ApiKeyRequest): ApiKeyRequestDto {
  return {
    id: r.id,
    organizationName: r.organizationName,
    staffFullName: r.staffFullName,
    position: r.position,
    organizationEmail: r.organizationEmail,
    contactPhone: r.contactPhone,
    referenceNumber: r.referenceNumber,
    purpose: r.purpose,
    driveLinks: r.driveLinks,
    status: r.status,
    rejectedReason: r.rejectedReason,
    createdAt: r.createdAt.toISOString(),
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
  };
}

export function toApiKeyDto(k: ApiKey): ApiKeyDto {
  return {
    id: k.id,
    prefix: k.prefix,
    scope: k.scope,
    organizationName: k.organizationName,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
  };
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

interface SubmitInput {
  userId: string;
  form: ApiKeyRequestFormInput;
}

export async function submitApiKeyRequest(input: SubmitInput): Promise<{
  request: ApiKeyRequest;
  plaintextVerificationToken: string;
}> {
  await prisma.apiKeyRequest.updateMany({
    where: {
      userId: input.userId,
      status: { in: ['pending_email', 'email_verified'] },
    },
    data: {
      status: 'rejected',
      rejectedReason: 'ถูกแทนที่ด้วยคำขอใหม่จากผู้ใช้รายเดียวกัน',
      verificationTokenHash: null,
      verificationExpiresAt: null,
    },
  });

  const plaintextToken = randomBytes(32).toString('hex');
  const tokenHash = sha256(plaintextToken);
  const uniqueLinks = Array.from(new Set(input.form.driveLinks.map((s) => s.trim())));

  const created = await prisma.apiKeyRequest.create({
    data: {
      userId: input.userId,
      organizationName: input.form.organizationName,
      staffFullName: input.form.staffFullName,
      position: input.form.position,
      organizationEmail: input.form.organizationEmail,
      contactPhone: input.form.contactPhone,
      referenceNumber: input.form.referenceNumber ?? null,
      purpose: input.form.purpose,
      driveLinks: uniqueLinks,
      status: 'pending_email',
      verificationTokenHash: tokenHash,
      verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  return { request: created, plaintextVerificationToken: plaintextToken };
}

export async function listMyRequests(userId: string): Promise<ApiKeyRequest[]> {
  return prisma.apiKeyRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

const STATUS_LABEL: Record<ApiKeyRequest['status'], string> = {
  pending_email: 'รอยืนยันอีเมล',
  email_verified: 'ยืนยันอีเมลแล้ว',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
  revoked: 'ถูกเพิกถอน',
};

function isoToBangkok(d: Date | null): string {
  if (!d) return '';
  return new Date(d.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
}

export function buildRequestsWorkbook(
  rows: Array<ApiKeyRequest & { user: { nationalId: string; email: string } }>,
): Buffer {
  const header = [
    'ID คำขอ', 'สถานะ', 'วันที่ส่งคำขอ', 'วันที่ยืนยัน',
    'ผู้ยื่น — เลขบัตรประชาชน', 'ผู้ยื่น — อีเมลบัญชี',
    'หน่วยงาน', 'ชื่อ-สกุลเจ้าหน้าที่', 'ตำแหน่ง/แผนก',
    'อีเมลหน่วยงาน (ใช้ยืนยัน)', 'เบอร์ติดต่อ', 'เลขที่หนังสืออ้างอิง',
    'วัตถุประสงค์', 'จำนวนลิงก์', 'ลิงก์ Google Drive',
  ];
  const data = rows.map((r) => [
    r.id, STATUS_LABEL[r.status], isoToBangkok(r.createdAt), isoToBangkok(r.verifiedAt),
    r.user.nationalId, r.user.email, r.organizationName, r.staffFullName, r.position,
    r.organizationEmail, r.contactPhone, r.referenceNumber ?? '', r.purpose,
    r.driveLinks.length, r.driveLinks.join('\n'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 28 },
    { wch: 30 }, { wch: 24 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 20 },
    { wch: 40 }, { wch: 10 }, { wch: 60 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'api_key_requests');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export async function getMyRequest(userId: string, id: string): Promise<ApiKeyRequest> {
  const row = await prisma.apiKeyRequest.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new ApiError('ไม่พบคำขอนี้', 404, 'REQUEST_NOT_FOUND');
  }
  return row;
}

interface VerifyResult {
  request: ApiKeyRequest;
  apiKey: ApiKey;
  plaintextKey: string;
}

function generatePlaintextKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const plaintext = `${KEY_PREFIX}${raw}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, KEY_PREFIX.length + 6),
    hash: sha256(plaintext),
  };
}

export async function verifyAndIssueKey(token: string): Promise<VerifyResult> {
  const tokenHash = sha256(token);
  const candidate = await prisma.apiKeyRequest.findFirst({
    where: { verificationTokenHash: tokenHash, status: 'pending_email' },
  });
  if (!candidate || !candidate.verificationTokenHash) {
    throw new ApiError('ลิงก์ยืนยันไม่ถูกต้องหรือถูกใช้ไปแล้ว', 400, 'INVALID_TOKEN');
  }
  if (!constantTimeEqualHex(candidate.verificationTokenHash, tokenHash)) {
    throw new ApiError('ลิงก์ยืนยันไม่ถูกต้องหรือถูกใช้ไปแล้ว', 400, 'INVALID_TOKEN');
  }
  if (candidate.verificationExpiresAt && candidate.verificationExpiresAt < new Date()) {
    throw new ApiError('ลิงก์ยืนยันหมดอายุแล้ว กรุณาส่งคำขอใหม่', 400, 'TOKEN_EXPIRED');
  }

  const { plaintext, prefix, hash } = generatePlaintextKey();
  const now = new Date();

  const [, , apiKey] = await prisma.$transaction([
    prisma.apiKeyRequest.update({
      where: { id: candidate.id },
      data: {
        status: 'approved',
        verifiedAt: now,
        verificationTokenHash: null,
        verificationExpiresAt: null,
      },
    }),
    prisma.apiKey.updateMany({
      where: { requestId: candidate.id, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.apiKey.create({
      data: {
        requestId: candidate.id,
        userId: candidate.userId,
        organizationName: candidate.organizationName,
        prefix,
        hash,
        scope: 'read_queue',
      },
    }),
  ]);

  const updatedRequest = await prisma.apiKeyRequest.findUniqueOrThrow({
    where: { id: candidate.id },
  });

  return { request: updatedRequest, apiKey, plaintextKey: plaintext };
}

export async function listMyKeys(userId: string): Promise<ApiKey[]> {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOwnedKey(userId: string, id: string): Promise<ApiKey> {
  const row = await prisma.apiKey.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new ApiError('ไม่พบ API key นี้', 404, 'KEY_NOT_FOUND');
  }
  return row;
}

export async function revokeKey(userId: string, id: string): Promise<ApiKey> {
  const key = await getOwnedKey(userId, id);
  if (key.revokedAt) return key;
  return prisma.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() },
  });
}

export async function regenerateKey(
  userId: string,
  id: string,
): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  const previous = await getOwnedKey(userId, id);
  const { plaintext, prefix, hash } = generatePlaintextKey();
  const now = new Date();
  const [, created] = await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: previous.id },
      data: { revokedAt: previous.revokedAt ?? now },
    }),
    prisma.apiKey.create({
      data: {
        requestId: previous.requestId,
        userId: previous.userId,
        organizationName: previous.organizationName,
        prefix,
        hash,
        scope: previous.scope,
      },
    }),
  ]);
  return { apiKey: created, plaintextKey: plaintext };
}

// ── API-key auth (for the /queue/all endpoint) ─────────────────────

export interface AuthenticatedApiKey {
  id: string;
  userId: string;
  scope: ApiKey['scope'];
}

export async function authenticateApiKey(plaintext: string): Promise<AuthenticatedApiKey> {
  if (!plaintext.startsWith(KEY_PREFIX)) {
    throw new ApiError('API key ไม่ถูกต้อง', 401, 'INVALID_API_KEY');
  }
  const hash = sha256(plaintext);
  const row = await prisma.apiKey.findUnique({ where: { hash } });
  if (!row) throw new ApiError('API key ไม่ถูกต้อง', 401, 'INVALID_API_KEY');
  if (row.revokedAt) throw new ApiError('API key ถูกเพิกถอนแล้ว', 401, 'KEY_REVOKED');
  return { id: row.id, userId: row.userId, scope: row.scope };
}

export async function recordApiKeyUsage(input: {
  apiKeyId: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode: number;
}): Promise<void> {
  await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: input.apiKeyId },
      data: { lastUsedAt: new Date() },
    }),
    prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId: input.apiKeyId,
        endpoint: input.endpoint,
        method: input.method,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        statusCode: input.statusCode,
      },
    }),
  ]);
}

// ── Rate limiting (in-memory token bucket; per-key) ────────────────

interface Bucket {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (b.count >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - b.windowStart)) / 1000),
    };
  }
  b.count++;
  return { ok: true };
}
