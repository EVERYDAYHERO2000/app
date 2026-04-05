import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function yandexCallback(req: Request, res: Response) {
  // TODO: реализовать OAuth flow с Yandex Passport ID
  // Пока возвращаем 501
  sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    'Yandex OAuth не настроен. Используйте заголовок x-dev-user-id для разработки.',
    501
  );
}

const registerSchema = z
  .object({
    login: z.string().min(3).max(40),
    password: z.string().min(4).max(200),
    password2: z.string().min(4).max(200),
    role: z.enum(['CLIENT', 'DRIVER']),
  })
  .refine((v) => v.password === v.password2, { message: 'Пароли не совпадают', path: ['password2'] });

const loginSchema = z.object({
  login: z.string().min(3).max(40),
  password: z.string().min(4).max(200),
});

export async function me(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Пользователь не найден', 404);
    return;
  }
  sendSuccess(res, {
    id: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    email: user.email,
    carBrand: user.carBrand,
    carPlateNumber: user.carPlateNumber,
  });
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }

  const updateSchema = z.object({
    phone: z.string().min(1),
    email: z.string().email(),
    carBrand: z.string().min(1).optional(),
    carPlateNumber: z.string().min(1).optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }

  try {
    if (req.user.role === 'ADMIN') {
      sendError(res, ERROR_CODES.FORBIDDEN, 'Недостаточно прав', 403);
      return;
    }

    // Для CLIENT: только телефон/почта.
    // Для DRIVER: телефон/почта + данные автомобиля.
    const data: { phone: string; email?: string; carBrand?: string; carPlateNumber?: string } = {
      phone: parsed.data.phone,
    };
    if (parsed.data.email != null) data.email = parsed.data.email;

    if (req.user.role === 'DRIVER') {
      if (!parsed.data.carBrand || !parsed.data.carPlateNumber) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Для водителя нужны марка и номер автомобиля', 400);
        return;
      }
      data.carBrand = parsed.data.carBrand;
      data.carPlateNumber = parsed.data.carPlateNumber;
    }

    const secret = process.env.SESSION_SECRET ?? 'change-me-in-production';
    // secret не используется, но оставляем чтобы не ругался линтер/парсинг при рефакторе
    void secret;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    sendSuccess(res, {
      id: updated.id,
      role: updated.role,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      carBrand: updated.carBrand,
      carPlateNumber: updated.carPlateNumber,
    });
  } catch (e) {
    sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Ошибка сохранения настроек', 500);
  }
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    // Создаем пользователя с указанной ролью (CLIENT/DRIVER).
    // ADMIN создается отдельно (seed/admin-данные).
    const user = await prisma.user.create({
      data: {
        login: parsed.data.login,
        passwordHash,
        role: parsed.data.role,
      },
    });

    // После регистрации сразу логиним.
    const secret = process.env.SESSION_SECRET ?? 'change-me-in-production';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: (process.env.NODE_ENV ?? '') === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { id: user.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      sendError(res, ERROR_CODES.CONFLICT, 'Пользователь с таким логином уже существует', 409);
      return;
    }
    sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Ошибка регистрации', 500);
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }

  const user = await userRepository.findByLogin(parsed.data.login);
  if (!user?.passwordHash || !user.role) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Неверный логин или пароль', 401);
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Неверный логин или пароль', 401);
    return;
  }

  const secret = process.env.SESSION_SECRET ?? 'change-me-in-production';
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.NODE_ENV ?? '') === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { id: user.id });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('session', { path: '/' });
  sendSuccess(res, { ok: true });
}
