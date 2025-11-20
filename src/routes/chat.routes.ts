import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verifyToken, chatController.startChat);
router.get('/:chatId/messages', verifyToken, chatController.getChatMessages);

export default router;

