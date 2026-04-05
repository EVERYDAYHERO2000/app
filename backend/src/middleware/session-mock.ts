/**
 * Заглушка сессии для разработки.
 * В проде заменить на реальную проверку cookie/JWT после Yandex OAuth.
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { isUserRole } from '../domain/user-role.js';
import jwt from 'jsonwebtoken';

const DEV_USER_ID_HEADER = 'x-dev-user-id';
const SESSION_COOKIE_NAME = 'session';

export async function sessionMock(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const devUserId = req.headers[DEV_USER_ID_HEADER] as string | undefined;
  if (devUserId) {
    const user = await prisma.user.findUnique({
      where: { id: devUserId },
      select: { id: true, role: true, yandexId: true },
    });
    if (user && isUserRole(user.role)) {
      req.user = {
        id: user.id,
        role: user.role,
        yandexId: user.yandexId,
      };
    }
  }

  // Если dev-заголовка нет — проверяем cookie-сессию (JWT).
  const token = (req.cookies?.[SESSION_COOKIE_NAME] as string | undefined) ?? undefined;
  if (!req.user && token) {
    try {
      const secret = process.env.SESSION_SECRET ?? 'change-me-in-production';
      const decoded = jwt.verify(token, secret) as { userId?: string };
      const userId = decoded?.userId;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, yandexId: true },
        });
        if (user && isUserRole(user.role)) {
          req.user = {
            id: user.id,
            role: user.role,
            yandexId: user.yandexId,
          };
        }
      }
    } catch {
      // Неверный токен — просто считаем, что пользователь не авторизован.
    }
  }
  next();
}
