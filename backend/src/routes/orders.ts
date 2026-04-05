import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { USER_ROLE } from '../domain/user-role.js';

const router = Router();

router.post('/', requireAuth, requireRole(USER_ROLE.CLIENT), orderController.createOrder);
router.get('/my', requireAuth, requireRole(USER_ROLE.CLIENT), orderController.getMyOrders);
router.get('/:id', requireAuth, orderController.getOrderById);
router.patch('/:id/status', requireAuth, orderController.updateOrderStatus);
router.get('/:id/status-check', requireAuth, orderController.statusCheck);

export default router;
