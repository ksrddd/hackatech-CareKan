import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '../../../shared/types';
import { config } from '../config.js';

export interface TokenPayload { sub: string; role: Role; }

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === 'string' || !('sub' in decoded) || !('role' in decoded)) {
    throw new Error('Malformed token');
  }
  return { sub: String(decoded.sub), role: decoded.role as Role };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
