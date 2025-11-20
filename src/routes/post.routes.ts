import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, postController.listPosts);
router.post('/', verifyToken, postController.createPost);

export default router;

