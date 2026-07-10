import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedHospitalKey } from '../../hospital-api/hospital-key.service.js';

/** ดึง req.hospitalKey ที่ HospitalKeyGuard แนบไว้ */
export const HospitalKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedHospitalKey => {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.hospitalKey) throw new Error('HospitalKey used on a route without HospitalKeyGuard');
    return req.hospitalKey;
  },
);
