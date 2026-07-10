import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../guards/jwt-auth.guard.js';

/** ดึง req.user ที่ JwtAuthGuard แนบไว้ — ใช้ได้เฉพาะ route ที่มี guard เท่านั้น */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user) throw new Error('CurrentUser used on a route without JwtAuthGuard');
    return req.user;
  },
);
