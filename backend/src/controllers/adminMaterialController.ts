import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ERROR_CODES } from '../lib/errors.js';
import { materialService } from '../services/materialService.js';
import { z } from 'zod';

const createMaterialSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  imageKey: z.string().optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const updateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  imageKey: z.string().optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const createSubmaterialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePricePerUnit: z.number().nonnegative(),
  markupPercent: z.number().min(0).max(1000).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const updateSubmaterialSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePricePerUnit: z.number().nonnegative().optional(),
  markupPercent: z.number().min(0).max(1000).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function listMaterials(req: Request, res: Response) {
  const materials = await materialService.listAll();
  sendSuccess(res, materials);
}

export async function createMaterial(req: Request, res: Response) {
  const parsed = createMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  const material = await materialService.create(parsed.data);
  sendSuccess(res, material, undefined, 201);
}

export async function updateMaterial(req: Request, res: Response) {
  const id = req.params.id as string;
  const parsed = updateMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  const material = await materialService.update(id, parsed.data);
  sendSuccess(res, material);
}

export async function deleteMaterial(req: Request, res: Response) {
  const id = req.params.id as string;
  await materialService.remove(id);
  sendSuccess(res, { id });
}

export async function addSubmaterial(req: Request, res: Response) {
  const materialId = req.params.id as string;
  const parsed = createSubmaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  const markupPercent = parsed.data.markupPercent ?? 0;
  const pricePerUnit = parsed.data.basePricePerUnit * (1 + markupPercent / 100);
  const submaterial = await materialService.addSubmaterial(materialId, {
    ...parsed.data,
    markupPercent,
    pricePerUnit,
  });
  sendSuccess(res, submaterial, undefined, 201);
}

export async function updateSubmaterial(req: Request, res: Response) {
  const id = req.params.id as string;
  const parsed = updateSubmaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Неверные данные', 400, parsed.error.flatten());
    return;
  }
  const patch: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.basePricePerUnit != null || parsed.data.markupPercent != null) {
    // Для пересчета итоговой цены нужны оба параметра; если один не пришел — берем из текущей записи.
    const current = await materialService.listAll();
    const existing = current.flatMap((m) => m.submaterials).find((s) => s.id === id);
    if (!existing) {
      sendError(res, ERROR_CODES.NOT_FOUND, 'Позиция прайса не найдена', 404);
      return;
    }
    const base = parsed.data.basePricePerUnit ?? Number(existing.basePricePerUnit ?? existing.pricePerUnit);
    const markup = parsed.data.markupPercent ?? Number(existing.markupPercent ?? 0);
    patch.pricePerUnit = base * (1 + markup / 100);
  }

  const submaterial = await materialService.updateSubmaterial(id, patch as any);
  sendSuccess(res, submaterial);
}

export async function deleteSubmaterial(req: Request, res: Response) {
  const id = req.params.id as string;
  await materialService.removeSubmaterial(id);
  sendSuccess(res, { id });
}
