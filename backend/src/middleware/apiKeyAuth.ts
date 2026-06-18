import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors.js';
import {
  authenticateApiKey,
  checkRateLimit,
  recordApiKeyUsage,
  type AuthenticatedApiKey,
} from '../services/apiKey.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: AuthenticatedApiKey;
    }
  }
}

function extractKey(req: Request): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.length > 0) return header;
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('ApiKey ')) return auth.slice(7);
  return null;
}

export function apiKeyGuard(requiredScope: 'read_queue') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const plaintext = extractKey(req);
    if (!plaintext) {
      throw new ApiError('ต้องแนบ API key ในส่วนหัว x-api-key', 401, 'MISSING_API_KEY');
    }
    const authed = await authenticateApiKey(plaintext);
    if (authed.scope !== requiredScope) {
      throw new ApiError('API key ไม่มีสิทธิ์เข้าถึงทรัพยากรนี้', 403, 'INSUFFICIENT_SCOPE');
    }
    const rate = checkRateLimit(authed.id);
    if (!rate.ok) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      throw new ApiError('คำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง', 429, 'RATE_LIMITED');
    }
    req.apiKey = authed;
    res.on('finish', () => {
      void recordApiKeyUsage({
        apiKeyId: authed.id,
        endpoint: req.originalUrl,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
        statusCode: res.statusCode,
      });
    });
    next();
  };
}
