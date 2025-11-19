import { Router } from 'express';
import { friendController } from '../controllers/friend.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, friendController.sendRequest);
router.patch('/:id', authenticate, friendController.respondRequest);

export default router;

