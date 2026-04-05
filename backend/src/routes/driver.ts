import { Router } from 'express';
import * as driverController from '../controllers/driverController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { USER_ROLE } from '../domain/user-role.js';

const router = Router();

router.get('/orders', requireAuth, requireRole(USER_ROLE.DRIVER), driverController.getMyOrders);
router.post(
  '/orders/:id/take',
  requireAuth,
  requireRole(USER_ROLE.DRIVER),
  driverController.takeOrder
);

export default router;
