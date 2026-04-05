import { Router } from 'express';
import * as materialController from '../controllers/materialController.js';

const router = Router();

router.get('/', materialController.listActive);

export default router;
