import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '../../../../shared/api';
import { ApiError } from './api-error.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

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
      res
        .status(400)
        .json({ error: 'ข้อมูลไม่ถูกต้อง', code: 'VALIDATION', details } satisfies ApiErrorBody);
      return;
    }

    // Nest-generated errors (route not found, bad JSON body, ...)
    if (err instanceof HttpException) {
      res.status(err.getStatus()).json({ error: err.message } satisfies ApiErrorBody);
      return;
    }

    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' } satisfies ApiErrorBody);
  }
}
