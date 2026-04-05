import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import type { OrderStatus } from '../domain/order-status.js';

export const orderRepository = {
  create(data: {
    clientId: string;
    clientRequestId?: string;
    material: string;
    materialSubtype?: string;
    materialNameSnapshot?: string;
    submaterialNameSnapshot?: string;
    volume: Prisma.Decimal;
    pricePerUnit?: Prisma.Decimal;
    totalPrice?: Prisma.Decimal;
    deliveryDate: Date;
    address: string;
    lat?: Prisma.Decimal;
    lng?: Prisma.Decimal;
    coordinates?: string;
    phone: string;
    comment?: string;
  }) {
    return prisma.order.create({
      data: {
        ...data,
        status: 'NEW',
      },
    });
  },

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  },

  findManyByClientId(clientId: string) {
    return prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { id: true, name: true } },
      },
    });
  },

  findManyForAdmin(filters?: { status?: OrderStatus }) {
    return prisma.order.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true } },
      },
    });
  },

  findManyByDriverId(driverId: string) {
    return prisma.order.findMany({
      where: {
        // Для экрана водителя в "Новые" должны попадать заказы, которые еще
        // не взял никто (driverId = null), плюс заказы, взятые этим водителем.
        OR: [{ driverId }, { driverId: null }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, phone: true } },
      },
    });
  },

  findForDriverTake(id: string) {
    return prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, driverId: true },
    });
  },

  takeOrderAsDriver(orderId: string, driverId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, driverId: null, status: 'NEW' },
        data: {
          driverId,
          status: 'ACCEPTED',
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) return null;

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: 'NEW',
          toStatus: 'ACCEPTED',
          changedBy: driverId,
        },
      });

      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          client: { select: { id: true, name: true, phone: true } },
        },
      });
    });
  },

  async updateStatus(
    id: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    changedBy: string,
    comment?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          status: toStatus,
          version: { increment: 1 },
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus,
          toStatus,
          changedBy,
          comment,
        },
      });
      return order;
    });
  },

  assignDriver(orderId: string, driverId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
  },
};
