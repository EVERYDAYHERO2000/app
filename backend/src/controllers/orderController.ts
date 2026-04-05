import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import { orderService } from '../services/orderService.js';
import { userRepository } from '../repositories/userRepository.js';
import { isCompletedStatus } from '../domain/order-status.js';
import { z } from 'zod';

const createOrderSchema = z.object({
  material: z.string().min(1),
  materialSubtype: z.string().optional(),
  volume: z.number().positive(),
  deliveryDate: z.string().min(1),
  address: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  phone: z.string().min(1).optional(),
  comment: z.string().optional(),
  clientRequestId: z.string().uuid().optional(),
  pricePerUnit: z.number().optional(),
  totalPrice: z.number().optional(),
  materialNameSnapshot: z.string().optional(),
  submaterialNameSnapshot: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED']),
  comment: z.string().optional(),
});

export async function createOrder(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  try {
    const user = await userRepository.findById(req.user.id);
    const phone = user?.phone ?? parsed.data.phone;
    if (!phone) {
      sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Укажите контактный телефон', 400);
      return;
    }

    const order = await orderService.create(req.user.id, { ...parsed.data, phone });
    sendSuccess(res, { id: order.id, status: order.status, createdAt: order.createdAt }, undefined, 201);
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Ошибка создания заказа';
    if (msg.includes('Unique constraint') && msg.includes('client_request_id')) {
      sendError(res, ERROR_CODES.CONFLICT, 'Заказ с таким clientRequestId уже существует', 409);
      return;
    }
    sendError(res, ERROR_CODES.INTERNAL_ERROR, msg, 500);
  }
}

export async function getMyOrders(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const orders = await orderService.getMyOrders(req.user.id);
  sendSuccess(res, orders);
}

export async function getOrderById(req: Request, res: Response) {
  const id = req.params.id as string;
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const order = await orderService.getById(id, req.user.id, req.user.role);
  if (!order) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Заказ не найден', 404);
    return;
  }
  const timeline = order.statusHistory.map((h) => ({
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    changedBy: h.user?.name ?? h.changedBy,
    comment: h.comment,
    createdAt: h.createdAt,
  }));
  sendSuccess(res, {
    ...order,
    timeline,
    driver: order.driver ? { id: order.driver.id, name: order.driver.name } : null,
  });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const id = req.params.id as string;
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  const result = await orderService.updateStatus(
    id,
    req.user.id,
    req.user.role,
    parsed.data.status as 'NEW' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED',
    parsed.data.comment
  );
  if (result.error) {
    const code = result.error;
    const msg = result.message ?? (code === ERROR_CODES.NOT_FOUND ? 'Заказ не найден' : code === ERROR_CODES.FORBIDDEN ? 'Недостаточно прав' : 'Недопустимый переход статуса');
    sendError(res, code, msg, code === ERROR_CODES.NOT_FOUND ? 404 : code === ERROR_CODES.FORBIDDEN ? 403 : 400);
    return;
  }
  sendSuccess(res, result.order);
}

export async function statusCheck(req: Request, res: Response) {
  const id = req.params.id as string;
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const order = await orderService.getById(id, req.user.id, req.user.role);
  if (!order) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Заказ не найден', 404);
    return;
  }
  const completed = isCompletedStatus(order.status as 'COMPLETED' | 'REJECTED');
  sendSuccess(res, {
    id: order.id,
    status: order.status,
    isCompleted: completed,
    shouldContinuePolling: !completed,
  });
}
