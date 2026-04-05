import { prisma } from '../lib/prisma.js';
import type { UserRole } from '../domain/user-role.js';

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        yandexId: true,
        role: true,
        name: true,
        phone: true,
        email: true,
        carBrand: true,
        carPlateNumber: true,
      },
    });
  },

  findByLogin(login: string) {
    return prisma.user.findUnique({
      where: { login },
    });
  },

  findByYandexId(yandexId: string) {
    return prisma.user.findUnique({
      where: { yandexId },
    });
  },

  create(data: {
    yandexId?: string;
    role?: UserRole;
    name?: string;
    phone?: string;
    email?: string;
  }) {
    return prisma.user.create({
      data: { ...data, role: data.role ?? 'CLIENT' },
    });
  },

  listDrivers() {
    return prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        carBrand: true,
        carPlateNumber: true,
      },
    });
  },

  listUsers() {
    // "Пользователи" в контексте админки: клиенты.
    return prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true, name: true, phone: true, email: true },
    });
  },
};
