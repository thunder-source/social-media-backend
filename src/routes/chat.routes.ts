import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, chatController.startChat);
router.get('/:chatId/messages', authenticate, chatController.getChatMessages);

export default router;

