import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', authenticate, userController.getProfile);
router.put('/:id', authenticate, userController.updateProfile);

export default router;

