import { Decimal } from '@prisma/client/runtime/library';
import { orderRepository } from '../repositories/orderRepository.js';
import { validateTransition, type OrderStatus } from '../domain/order-status.js';
import { ERROR_CODES } from '../lib/errors.js';
import type { UserRole } from '../domain/user-role.js';

export const orderService = {
  async create(
    clientId: string,
    body: {
      material: string;
      materialSubtype?: string;
      volume: number;
      deliveryDate: string;
      address: string;
      coordinates?: { lat: number; lng: number };
      phone: string;
      comment?: string;
      clientRequestId?: string;
      pricePerUnit?: number;
      totalPrice?: number;
      materialNameSnapshot?: string;
      submaterialNameSnapshot?: string;
    }
  ) {
    const deliveryDate = new Date(body.deliveryDate);
    const volume = new Decimal(body.volume);
    const pricePerUnit = body.pricePerUnit != null ? new Decimal(body.pricePerUnit) : undefined;
    const totalPrice = body.totalPrice != null ? new Decimal(body.totalPrice) : undefined;
    const lat = body.coordinates?.lat != null ? new Decimal(body.coordinates.lat) : undefined;
    const lng = body.coordinates?.lng != null ? new Decimal(body.coordinates.lng) : undefined;
    const coordinates =
      body.coordinates != null
        ? `${body.coordinates.lat},${body.coordinates.lng}`
        : undefined;

    return orderRepository.create({
      clientId,
      clientRequestId: body.clientRequestId,
      material: body.material,
      materialSubtype: body.materialSubtype,
      materialNameSnapshot: body.materialNameSnapshot,
      submaterialNameSnapshot: body.submaterialNameSnapshot,
      volume,
      pricePerUnit,
      totalPrice,
      deliveryDate,
      address: body.address,
      lat,
      lng,
      coordinates,
      phone: body.phone,
      comment: body.comment,
    });
  },

  async getById(id: string, userId: string, userRole: UserRole) {
    const order = await orderRepository.findById(id);
    if (!order) return null;
    if (userRole === 'CLIENT' && order.clientId !== userId) return null;
    if (userRole === 'DRIVER' && order.driverId !== userId) return null;
    return order;
  },

  async getMyOrders(clientId: string) {
    return orderRepository.findManyByClientId(clientId);
  },

  async getAdminOrders(filters?: { status?: OrderStatus }) {
    return orderRepository.findManyForAdmin(filters);
  },

  async getDriverOrders(driverId: string) {
    return orderRepository.findManyByDriverId(driverId);
  },

  async updateStatus(
    orderId: string,
    userId: string,
    userRole: UserRole,
    toStatus: OrderStatus,
    comment?: string
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) return { error: ERROR_CODES.NOT_FOUND };
    const fromStatus = order.status as OrderStatus;
    const { valid, error } = validateTransition(fromStatus, toStatus);
    if (!valid) return { error: ERROR_CODES.INVALID_STATUS_TRANSITION, message: error };
    if (userRole === 'DRIVER') {
      if (order.driverId !== userId) return { error: ERROR_CODES.FORBIDDEN };
      const driverAllowed = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(toStatus);
      if (!driverAllowed) return { error: ERROR_CODES.FORBIDDEN };
    }
    await orderRepository.updateStatus(orderId, fromStatus, toStatus, userId, comment);
    return { order: await orderRepository.findById(orderId) };
  },

  async assignDriver(orderId: string, driverId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) return { error: ERROR_CODES.NOT_FOUND };
    if (order.status !== 'CONFIRMED' && order.status !== 'ACCEPTED')
      return { error: ERROR_CODES.INVALID_STATUS_TRANSITION, message: 'Назначить водителя можно только для заказа в статусе Принят/Подтвержден' };
    await orderRepository.assignDriver(orderId, driverId);
    return { order: await orderRepository.findById(orderId) };
  },

  async takeOrderAsDriver(orderId: string, driverId: string) {
    const order = await orderRepository.findForDriverTake(orderId);
    if (!order) return { error: ERROR_CODES.NOT_FOUND, message: 'Заказ не найден' };
    if (order.driverId && order.driverId !== driverId) return { error: ERROR_CODES.FORBIDDEN, message: 'Заказ уже взят другим водителем' };
    if (order.status !== 'NEW') return { error: ERROR_CODES.FORBIDDEN, message: 'Этот заказ нельзя взять сейчас' };

    const taken = await orderRepository.takeOrderAsDriver(orderId, driverId);
    if (!taken) return { error: ERROR_CODES.FORBIDDEN, message: 'Заказ уже взят другим водителем' };

    return { order: taken };
  },
};
