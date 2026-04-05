import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import { orderService } from '../services/orderService.js';

export async function listOrders(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const filters =
    status && ['NEW', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)
      ? { status: status as 'NEW' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' }
      : undefined;
  const orders = await orderService.getAdminOrders(filters);
  sendSuccess(res, orders);
}

export async function assignDriver(req: Request, res: Response) {
  const orderId = req.params.id as string;
  const driverId = req.body?.driverId as string | undefined;
  if (!driverId) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Требуется driverId', 400);
    return;
  }
  const result = await orderService.assignDriver(orderId, driverId);
  if (result.error) {
    sendError(
      res,
      result.error,
      result.message ?? 'Не удалось назначить водителя',
      result.error === ERROR_CODES.NOT_FOUND ? 404 : 400
    );
    return;
  }
  sendSuccess(res, result.order);
}
