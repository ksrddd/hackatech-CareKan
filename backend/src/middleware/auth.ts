import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../../../shared/types';
import { ApiError } from '../errors.js';
import { verifyToken } from '../services/auth.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: Role }; }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new ApiError('โทเคนไม่ถูกต้องหรือหมดอายุ', 401, 'INVALID_TOKEN');
  }
}

export function roleGuard(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
    if (req.user.role !== role) throw new ApiError('ไม่มีสิทธิ์เข้าถึง', 403, 'FORBIDDEN');
    next();
  };
}
