import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:userId', authenticate, notificationController.listNotifications);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;

