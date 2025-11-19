import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, postController.listPosts);
router.post('/', authenticate, postController.createPost);

export default router;

