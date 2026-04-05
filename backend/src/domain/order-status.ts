/**
 * Валидатор переходов статусов заказа.
 * Единая точка истины — не дублировать логику.
 */

export const ORDER_STATUS = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

const TERMINAL: OrderStatus[] = ['REJECTED', 'COMPLETED'];

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  NEW: ['ACCEPTED'],
  ACCEPTED: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

export function isCompletedStatus(status: OrderStatus): boolean {
  return status === 'COMPLETED' || status === 'REJECTED';
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus
): { valid: boolean; error?: string } {
  if (!from || !to) {
    return { valid: false, error: 'Статусы обязательны' };
  }
  if (isTerminalStatus(from)) {
    return { valid: false, error: 'Из конечного статуса переход невозможен' };
  }
  if (!canTransition(from, to)) {
    return {
      valid: false,
      error: `Недопустимый переход: ${from} -> ${to}`,
    };
  }
  return { valid: true };
}
