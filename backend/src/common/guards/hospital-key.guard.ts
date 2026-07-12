import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import {
  HospitalKeyService,
  type AuthenticatedHospitalKey,
} from '../../hospital-api/hospital-key.service.js';
import { ApiError } from '../errors/api-error.js';

declare module 'express' {
  interface Request {
    hospitalKey?: AuthenticatedHospitalKey;
  }
}

function extractKey(req: Request): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.length > 0) return header;
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('ApiKey ')) return auth.slice(7);
  return null;
}

@Injectable()
export class HospitalKeyGuard implements CanActivate {
  constructor(private readonly keys: HospitalKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const plaintext = extractKey(req);
    if (!plaintext) {
      throw new ApiError('ต้องแนบ API key ในส่วนหัว x-api-key', 401, 'MISSING_API_KEY');
    }
    req.hospitalKey = await this.keys.authenticateHospitalKey(plaintext);
    return true;
  }
}
