import { prisma } from '../lib/prisma.js';

export const materialRepository = {
  listActive() {
    return prisma.material.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        submaterials: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  listAll() {
    return prisma.material.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        submaterials: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  findById(id: string) {
    return prisma.material.findUnique({
      where: { id },
      include: { submaterials: { orderBy: { sortOrder: 'asc' } } },
    });
  },

  create(data: {
    name: string;
    slug: string;
    imageKey?: string;
    unit?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return prisma.material.create({ data });
  },

  update(
    id: string,
    data: { name?: string; slug?: string; imageKey?: string; unit?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return prisma.material.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.material.delete({ where: { id } });
  },

  createSubmaterial(
    materialId: string,
    data: {
      name: string;
      description?: string;
      basePricePerUnit?: number;
      markupPercent?: number;
      pricePerUnit: number;
      currency?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    return prisma.submaterial.create({
      data: { ...data, materialId, currency: data.currency ?? 'RUB' },
    });
  },

  updateSubmaterial(
    id: string,
    data: {
      name?: string;
      description?: string;
      basePricePerUnit?: number;
      markupPercent?: number;
      pricePerUnit?: number;
      currency?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    return prisma.submaterial.update({ where: { id }, data });
  },

  removeSubmaterial(id: string) {
    return prisma.submaterial.delete({ where: { id } });
  },
};
