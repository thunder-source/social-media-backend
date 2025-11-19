import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { RequestWithUser } from '../types';

class PostController {
  createPost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const author = req.body.author ?? req.user?.id;
      const { content, mediaUrl } = req.body;

      if (!author || !content) {
        res.status(400).json({ message: 'Author and content are required.' });
        return;
      }

      const post = await Post.create({ author, content, mediaUrl });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  };

  listPosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await Post.find().populate('author', '-password').sort({ createdAt: -1 });
      res.json(posts);
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();

