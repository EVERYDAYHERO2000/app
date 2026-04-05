import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import { orderService } from '../services/orderService.js';

export async function getMyOrders(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const orders = await orderService.getDriverOrders(req.user.id);
  sendSuccess(res, orders);
}

export async function takeOrder(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Требуется авторизация', 401);
    return;
  }
  const orderId = req.params.id as string;
  const result = await orderService.takeOrderAsDriver(orderId, req.user.id);
  if (result.error) {
    const statusCode = result.error === ERROR_CODES.NOT_FOUND ? 404 : 403;
    sendError(res, result.error, result.message ?? 'Не удалось взять заказ', statusCode);
    return;
  }
  sendSuccess(res, result.order);
}
