import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:userId', verifyToken, notificationController.listNotifications);
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

export default router;

