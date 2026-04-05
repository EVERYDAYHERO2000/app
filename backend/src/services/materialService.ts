import { materialRepository } from '../repositories/materialRepository.js';

export const materialService = {
  async listActive() {
    return materialRepository.listActive();
  },

  async listAll() {
    return materialRepository.listAll();
  },

  async create(data: {
    name: string;
    slug: string;
    imageKey?: string;
    unit?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return materialRepository.create(data);
  },

  async update(
    id: string,
    data: { name?: string; slug?: string; imageKey?: string; unit?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return materialRepository.update(id, data);
  },

  async remove(id: string) {
    return materialRepository.remove(id);
  },

  async addSubmaterial(
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
    return materialRepository.createSubmaterial(materialId, data);
  },

  async updateSubmaterial(
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
    return materialRepository.updateSubmaterial(id, data);
  },

  async removeSubmaterial(id: string) {
    return materialRepository.removeSubmaterial(id);
  },
};
