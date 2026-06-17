import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors.js';
import type { ApiErrorBody } from '../../../shared/api';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = { error: err.message };
    if (err.code) body.code = err.code;
    if (err.details) body.details = err.details;
    res.status(err.status).json(body);
    return;
  }
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) details[issue.path.join('.') || '_'] = issue.message;
    res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', code: 'VALIDATION', details } satisfies ApiErrorBody);
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' } satisfies ApiErrorBody);
}
