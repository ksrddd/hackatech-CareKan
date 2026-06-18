import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors.js';
import { verifyToken } from '../services/auth.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string }; }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub };
    next();
  } catch {
    throw new ApiError('โทเคนไม่ถูกต้องหรือหมดอายุ', 401, 'INVALID_TOKEN');
  }
}
