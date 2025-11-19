import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { RequestWithUser } from '../types';

class PostController {
  createPost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.body.userId;
      const { text, mediaUrl, mediaType } = req.body;

      if (!userId || !text) {
        res.status(400).json({ message: 'User and text are required.' });
        return;
      }

      if (mediaType && !['image', 'video'].includes(mediaType)) {
        res.status(400).json({ message: 'mediaType must be image or video.' });
        return;
      }

      const post = await Post.create({ userId, text, mediaUrl, mediaType });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  };

  listPosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await Post.find().populate('userId', '-password').sort({ createdAt: -1 });
      res.json(posts);
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();

