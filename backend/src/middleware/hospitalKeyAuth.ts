import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors.js';
import {
  authenticateHospitalKey,
  type AuthenticatedHospitalKey,
} from '../services/hospitalKey.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      hospitalKey?: AuthenticatedHospitalKey;
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

export async function hospitalKeyAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const plaintext = extractKey(req);
  if (!plaintext) {
    throw new ApiError('ต้องแนบ API key ในส่วนหัว x-api-key', 401, 'MISSING_API_KEY');
  }
  req.hospitalKey = await authenticateHospitalKey(plaintext);
  next();
}
