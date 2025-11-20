import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', verifyToken, userController.getProfile);
router.put('/:id', verifyToken, userController.updateProfile);

export default router;

