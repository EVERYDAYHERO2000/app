import bcrypt from 'bcryptjs';

export async function hashPassword(password: string) {
  // 10 — компромисс для локалки и простоты; при необходимости можно увеличить.
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

