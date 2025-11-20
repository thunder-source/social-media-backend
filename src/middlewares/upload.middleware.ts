import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

// File type validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, jpeg, png, gif, mp4, mov, and avi files are allowed.'));
  }
};

// Size limits: 10MB for images, 100MB for videos
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Custom limits based on file type
const limits = {
  fileSize: MAX_VIDEO_SIZE, // Set to max (video size)
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Middleware to check file size based on type
export const validateFileSize = (req: Request, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  const isImage = req.file.mimetype.startsWith('image/');
  const isVideo = req.file.mimetype.startsWith('video/');

  if (isImage && req.file.size > MAX_IMAGE_SIZE) {
    return res.status(400).json({
      message: `Image file size exceeds the limit of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    });
  }

  if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
    return res.status(400).json({
      message: `Video file size exceeds the limit of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
    });
  }

  next();
};

