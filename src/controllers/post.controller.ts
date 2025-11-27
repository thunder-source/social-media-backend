import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { RequestWithUser, AuthenticatedUser } from '../types';
import { uploadToFirebase, deleteFromFirebase } from '../services/firebase.service';
import { Types } from 'mongoose';
import { compressVideo } from '../services/video.service';
import { createAndEmit } from '../services/notification.service';
import { videoQueue } from '../config/queue';
import { Like } from '../models/Like';

class PostController {
  /**
   * Create a new post with optional media upload
   * POST /api/posts
   */
  createPost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { text } = req.body;
      const file = req.file;

      // Validation
      if (!text || text.trim().length === 0) {
        res.status(400).json({ message: 'Post text is required.' });
        return;
      }

      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | null = null;

      // Handle file upload
      if (file) {
        // Async Video Processing
        if (file.mimetype.startsWith('video/') && videoQueue) {
             mediaUrl = await uploadToFirebase(file, 'posts');
             const post = await Post.create({
                userId: user.id,
                text: text.trim(),
                mediaUrl,
                mediaType: 'video',
                processingStatus: 'pending',
             });

             await videoQueue.add('compress-video', {
                 postId: post._id.toString(),
                 fileUrl: mediaUrl,
                 originalName: file.originalname,
                 mimetype: file.mimetype,
                 userId: user.id
             });

             await post.populate('userId', '-password');
             
             const postResponse = {
                ...post.toObject(),
                isLiked: false,
                commentsCount: 0
             };

             res.status(201).json(postResponse);
             return;
        }

        let fileToUpload = file;

        // Compress video if it's a video file (Sync Fallback)
        if (file.mimetype.startsWith('video/')) {
          try {
            console.log('Compressing video (Sync)...');
            const compressedBuffer = await compressVideo(file.buffer, file.originalname);
            
            // Create a new file object with compressed buffer
            fileToUpload = {
              ...file,
              buffer: compressedBuffer,
              size: compressedBuffer.length
            };
            console.log(`Video compressed. Original size: ${file.size}, New size: ${fileToUpload.size}`);
          } catch (error) {
            console.error("Video compression failed, uploading original file:", error);
            // Fallback to original file if compression fails
          }
        }

        mediaUrl = await uploadToFirebase(fileToUpload, 'posts');
        mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      }

      const post = await Post.create({
        userId: user.id,
        text: text.trim(),
        mediaUrl,
        mediaType,
        processingStatus: 'completed',
      });

      // Populate user info before sending response
      await post.populate('userId', '-password');

      const postResponse = {
        ...post.toObject(),
        isLiked: false,
        commentsCount: 0
      };

      res.status(201).json(postResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all posts with pagination
   * GET /api/posts?page=1&limit=10
   */
  getAllPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find()
          .populate('userId', '-password')
          .populate('comments.userId', 'name photo')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Post.countDocuments(),
      ]);

      const user = (req as RequestWithUser).user as AuthenticatedUser;
      let likedPostIds = new Set<string>();

      if (user) {
        const likes = await Like.find({
          user: user.id,
          post: { $in: posts.map(p => p._id) }
        });
        likedPostIds = new Set(likes.map(l => l.post.toString()));
      }

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post._id.toString()),
        commentsCount: post.comments?.length || 0
      }));

      res.json({
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single post by ID
   * GET /api/posts/:id
   */
  getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid post ID.' });
        return;
      }

      const post = await Post.findById(id)
        .populate('userId', '-password')
        .populate('comments.userId', 'name photo')
        .lean();

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      const user = (req as RequestWithUser).user as AuthenticatedUser;
      let isLiked = false;

      if (user) {
        isLiked = !!(await Like.exists({ user: user.id, post: id }));
      }

      res.json({ 
        ...post, 
        isLiked,
        commentsCount: post.comments?.length || 0
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a post (owner only)
   * PUT /api/posts/:id
   */
  updatePost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;
      const { text } = req.body;
      const file = req.file;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid post ID.' });
        return;
      }

      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      // Authorization check
      if (post.userId.toString() !== user.id) {
        res.status(403).json({ message: 'You are not authorized to update this post.' });
        return;
      }

      // Update text if provided
      if (text) {
        post.text = text.trim();
      }

      // Handle new media upload
      if (file) {
        // Delete old media if exists
        if (post.mediaUrl) {
          await deleteFromFirebase(post.mediaUrl);
        }

        // Async Video Processing
        if (file.mimetype.startsWith('video/') && videoQueue) {
             const mediaUrl = await uploadToFirebase(file, 'posts');
             
             post.mediaUrl = mediaUrl;
             post.mediaType = 'video';
             post.processingStatus = 'pending';
             
             await post.save();

             await videoQueue.add('compress-video', {
                 postId: post._id.toString(),
                 fileUrl: mediaUrl,
                 originalName: file.originalname,
                 mimetype: file.mimetype,
                 userId: user.id
             });

             await post.populate('userId', '-password');
             
             const isLiked = !!(await Like.exists({ user: user.id, post: post._id }));

             const postResponse = {
                ...post.toObject(),
                isLiked,
                commentsCount: post.comments?.length || 0
             };

             res.json(postResponse);
             return;
        }

        let fileToUpload = file;

        // Compress video if it's a video file (Sync Fallback)
        if (file.mimetype.startsWith('video/')) {
          try {
            console.log('Compressing video (Sync)...');
            const compressedBuffer = await compressVideo(file.buffer, file.originalname);
            
            // Create a new file object with compressed buffer
            fileToUpload = {
              ...file,
              buffer: compressedBuffer,
              size: compressedBuffer.length
            };
            console.log(`Video compressed. Original size: ${file.size}, New size: ${fileToUpload.size}`);
          } catch (error) {
            console.error("Video compression failed, uploading original file:", error);
            // Fallback to original file if compression fails
          }
        }

        // Upload new media
        post.mediaUrl = await uploadToFirebase(fileToUpload, 'posts');
        post.mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        post.processingStatus = 'completed';
      }

      await post.save();
      await post.populate('userId', '-password');

      const isLiked = !!(await Like.exists({ user: user.id, post: post._id }));

      const postResponse = {
        ...post.toObject(),
        isLiked,
        commentsCount: post.comments?.length || 0
      };

      res.json(postResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a post (owner only)
   * DELETE /api/posts/:id
   */
  deletePost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid post ID.' });
        return;
      }

      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      // Authorization check
      if (post.userId.toString() !== user.id) {
        res.status(403).json({ message: 'You are not authorized to delete this post.' });
        return;
      }

      // Delete media from Firebase if exists
      if (post.mediaUrl) {
        await deleteFromFirebase(post.mediaUrl);
      }

      await Post.findByIdAndDelete(id);

      res.json({ message: 'Post deleted successfully.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Like/unlike a post
   * POST /api/posts/:id/like
   */
  likePost = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid post ID.' });
        return;
      }

      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      const userObjectId = new Types.ObjectId(user.id);
      
      const existingLike = await Like.findOne({ user: user.id, post: id });
      let isLiked = false;

      if (existingLike) {
        // Unlike
        await Like.deleteOne({ _id: existingLike._id });
        post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
        isLiked = false;
      } else {
        // Like
        await Like.create({ user: user.id, post: id });
        post.likesCount = (post.likesCount || 0) + 1;
        isLiked = true;
        
        // Send notification if liking someone else's post
        if (post.userId.toString() !== user.id) {
          await createAndEmit(post.userId.toString(), 'post_like', {
            fromUserId: user.id,
            postId: post._id.toString(),
          });
        }
      }

      await post.save();
      const populatedPost = await Post.findById(post._id)
          .populate('userId', '-password')
          .lean();

      res.json({ 
          ...populatedPost, 
          isLiked,
          commentsCount: post.comments?.length || 0
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a comment to a post
   * POST /api/posts/:id/comment
   */
  addComment = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;
      const { text } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid post ID.' });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(400).json({ message: 'Comment text is required.' });
        return;
      }

      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      const comment = {
        userId: new Types.ObjectId(user.id),
        text: text.trim(),
        createdAt: new Date(),
      };

      if (!post.comments) {
        post.comments = [];
      }

      post.comments.push(comment);
      await post.save();

      // Send notification if commenting on someone else's post
      if (post.userId.toString() !== user.id) {
        await createAndEmit(post.userId.toString(), 'post_comment', {
          fromUserId: user.id,
          postId: post._id.toString(),
        });
      }

      // Populate user info for response
      await post.populate('userId', '-password');
      await post.populate('comments.userId', 'name photo');

      const isLiked = !!(await Like.exists({ user: user.id, post: post._id }));

      const postResponse = {
        ...post.toObject(),
        isLiked,
        commentsCount: post.comments?.length || 0
      };

      res.status(201).json(postResponse);
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();
