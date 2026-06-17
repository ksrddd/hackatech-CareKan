import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, string>;
  constructor(message: string, status: number, code?: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler<
  H extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
>(fn: H) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
