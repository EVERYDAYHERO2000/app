import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import type { UserRole } from '../domain/user-role.js';

export interface AuthUser {
  id: string;
  role: UserRole;
  yandexId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, ERROR_CODES.FORBIDDEN, 'Недостаточно прав', 403);
      return;
    }
    next();
  };
}
