import type { Response } from 'express';
import { ERROR_CODES, type ErrorCode } from './errors.js';

export function sendSuccess(
  res: Response,
  data: unknown,
  meta?: Record<string, unknown>,
  statusCode = 200
) {
  res.status(statusCode).json({
    ok: true,
    data,
    ...(meta && Object.keys(meta).length > 0 && { meta }),
  });
}

export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
) {
  res.status(statusCode).json({
    ok: false,
    error: {
      code: code in ERROR_CODES ? code : 'INTERNAL_ERROR',
      message,
      ...(details && Object.keys(details).length > 0 && { details }),
    },
  });
}
