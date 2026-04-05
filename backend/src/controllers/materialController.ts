import type { Request, Response } from 'express';
import { sendSuccess } from '../lib/response.js';
import { materialService } from '../services/materialService.js';

/** Публичный прайс-лист для формы создания заказа (клиент). */
export async function listActive(req: Request, res: Response) {
  const materials = await materialService.listActive();
  sendSuccess(res, materials);
}
