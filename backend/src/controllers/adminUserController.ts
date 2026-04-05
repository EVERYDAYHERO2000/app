import type { Request, Response } from 'express';
import { sendSuccess } from '../lib/response.js';
import { userRepository } from '../repositories/userRepository.js';

export async function listDrivers(_req: Request, res: Response) {
  const drivers = await userRepository.listDrivers();
  sendSuccess(res, drivers);
}

export async function listUsers(_req: Request, res: Response) {
  const users = await userRepository.listUsers();
  sendSuccess(res, users);
}

