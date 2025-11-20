import { Router } from 'express';
import { friendController } from '../controllers/friend.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verifyToken, friendController.sendRequest);
router.patch('/:id', verifyToken, friendController.respondRequest);

export default router;

