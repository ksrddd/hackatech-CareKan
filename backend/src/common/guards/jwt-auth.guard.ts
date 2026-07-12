import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service.js';
import { ApiError } from '../errors/api-error.js';

export interface RequestUser {
  id: string;
}

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
    }
    try {
      const payload = this.auth.verifyToken(header.slice(7));
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new ApiError('โทเคนไม่ถูกต้องหรือหมดอายุ', 401, 'INVALID_TOKEN');
    }
  }
}
