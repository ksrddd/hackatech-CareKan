import type { Request, Response } from 'express';
import type {
  ApiKeyRegenerateResponse,
  ApiKeyRequestSubmittedResponse,
  ApiKeyRequestsResponse,
  ApiKeyResponse,
  ApiKeyVerifyResponse,
  ApiKeysResponse,
  QueueAllResponse,
} from '../../../shared/api';
import { ApiError } from '../errors.js';
import { prisma } from '../prisma.js';
import { apiKeyRequestFormSchema, apiKeyVerifySchema } from '../validation/schemas.js';
import {
  buildRequestsWorkbook,
  getMyRequest,
  listMyKeys,
  listMyRequests,
  regenerateKey,
  revokeKey,
  submitApiKeyRequest,
  toApiKeyDto,
  toApiKeyRequestDto,
  verifyAndIssueKey,
} from '../services/apiKey.service.js';
import { toAppointmentDto } from '../services/mappers.js';

function publicBaseUrl(req: Request): string {
  const proto = req.get('x-forwarded-proto') ?? req.protocol;
  return `${proto}://${req.get('host')}`;
}

export async function submit(req: Request, res: Response): Promise<void> {
  const form = apiKeyRequestFormSchema.parse(req.body);
  const { request, plaintextVerificationToken } = await submitApiKeyRequest({
    userId: req.user!.id,
    form,
  });

  const verificationUrl = `${publicBaseUrl(req)}/api/api-keys/verify?token=${plaintextVerificationToken}`;
  const isProd = process.env['NODE_ENV'] === 'production';

  // eslint-disable-next-line no-console
  console.log(
    `[apiKey] sent verification email to ${request.organizationEmail} for request ${request.id}`,
  );

  const body: ApiKeyRequestSubmittedResponse = {
    request: toApiKeyRequestDto(request),
    ...(isProd ? {} : { devVerificationUrl: verificationUrl }),
  };
  res.status(201).json(body);
}

export async function myRequests(req: Request, res: Response): Promise<void> {
  const rows = await listMyRequests(req.user!.id);
  res.json({ requests: rows.map(toApiKeyRequestDto) } satisfies ApiKeyRequestsResponse);
}

export async function verify(req: Request, res: Response): Promise<void> {
  const { token } = apiKeyVerifySchema.parse({
    token: req.method === 'POST' ? req.body?.token : req.query['token'],
  });
  const result = await verifyAndIssueKey(token);
  const body: ApiKeyVerifyResponse = {
    request: toApiKeyRequestDto(result.request),
    apiKey: toApiKeyDto(result.apiKey),
    plaintextKey: result.plaintextKey,
  };
  res.json(body);
}

export async function myKeys(req: Request, res: Response): Promise<void> {
  const rows = await listMyKeys(req.user!.id);
  res.json({ apiKeys: rows.map(toApiKeyDto) } satisfies ApiKeysResponse);
}

export async function revoke(req: Request, res: Response): Promise<void> {
  const key = await revokeKey(req.user!.id, req.params['id'] as string);
  res.json({ apiKey: toApiKeyDto(key) } satisfies ApiKeyResponse);
}

export async function regenerate(req: Request, res: Response): Promise<void> {
  const result = await regenerateKey(req.user!.id, req.params['id'] as string);
  res.json({
    apiKey: toApiKeyDto(result.apiKey),
    plaintextKey: result.plaintextKey,
  } satisfies ApiKeyRegenerateResponse);
}

export async function exportMyRequest(req: Request, res: Response): Promise<void> {
  const row = await getMyRequest(req.user!.id, req.params['id'] as string);
  if (row.status !== 'approved' && row.status !== 'email_verified') {
    throw new ApiError(
      'ดาวน์โหลดได้หลังยืนยันคำขอสำเร็จเท่านั้น',
      400,
      'REQUEST_NOT_VERIFIED',
    );
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { nationalId: true, email: true },
  });
  const buffer = buildRequestsWorkbook([{ ...row, user }]);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="api-key-request-${row.id}.xlsx"`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.send(buffer);
}

export async function queueAll(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.reserve.findMany({
    include: {
      schedule: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ schedule: { date: 'desc' } }, { schedule: { startTime: 'asc' } }],
  });
  res.json({ appointments: rows.map(toAppointmentDto) } satisfies QueueAllResponse);
}
