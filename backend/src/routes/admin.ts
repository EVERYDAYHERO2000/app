import { Router } from 'express';
import * as adminOrderController from '../controllers/adminOrderController.js';
import * as adminMaterialController from '../controllers/adminMaterialController.js';
import * as adminUserController from '../controllers/adminUserController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { USER_ROLE } from '../domain/user-role.js';

const router = Router();
const adminOnly = requireRole(USER_ROLE.ADMIN);

router.use(requireAuth, adminOnly);

router.get('/orders', adminOrderController.listOrders);
router.patch('/orders/:id/assign-driver', adminOrderController.assignDriver);

router.get('/materials', adminMaterialController.listMaterials);
router.post('/materials', adminMaterialController.createMaterial);
router.patch('/materials/:id', adminMaterialController.updateMaterial);
router.delete('/materials/:id', adminMaterialController.deleteMaterial);
router.post('/materials/:id/submaterials', adminMaterialController.addSubmaterial);
router.patch('/submaterials/:id', adminMaterialController.updateSubmaterial);
router.delete('/submaterials/:id', adminMaterialController.deleteSubmaterial);

router.get('/drivers', adminUserController.listDrivers);
router.get('/users', adminUserController.listUsers);

export default router;
