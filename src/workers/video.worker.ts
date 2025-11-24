import { Worker, Job } from 'bullmq';
import { connection } from '../config/queue';
import { compressVideoFromFile } from '../services/video.service';
import { uploadToFirebase, deleteFromFirebase } from '../services/firebase.service';
import { Post } from '../models/Post';
import { createAndEmit } from '../services/notification.service';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

export const videoWorker = connection ? new Worker('video-processing', async (job: Job) => {
  const { postId, fileUrl, originalName, mimetype, userId } = job.data;
  
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `raw-${postId}-${Date.now()}`);
  const outputPath = path.join(tempDir, `processed-${postId}-${Date.now()}`);

  try {
    console.log(`Processing video for post ${postId}`);
    await Post.findByIdAndUpdate(postId, { processingStatus: 'processing' });

    // Download file
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    if (!response.body) throw new Error('No response body');
    
    // Write to disk
    const fileStream = createWriteStream(inputPath);
    // @ts-ignore
    await pipeline(response.body, fileStream);

    // Compress
    await compressVideoFromFile(inputPath, outputPath);

    // Read compressed
    const compressedBuffer = await fs.promises.readFile(outputPath);

    // Upload
    const fileToUpload = {
        buffer: compressedBuffer,
        originalname: originalName,
        mimetype: mimetype,
    } as Express.Multer.File;

    const newMediaUrl = await uploadToFirebase(fileToUpload, 'posts');

    // Update Post
    await Post.findByIdAndUpdate(postId, {
        mediaUrl: newMediaUrl,
        processingStatus: 'completed',
        mediaType: 'video'
    });

    // Delete old raw file
    await deleteFromFirebase(fileUrl);

    // Notify
    await createAndEmit(userId, 'video_processed', {
        fromUserId: userId,
        postId,
        message: 'Your video has been processed and is now available.'
    });

    console.log(`Video processed for post ${postId}`);

  } catch (error) {
      console.error(`Video processing failed for post ${postId}:`, error);
      await Post.findByIdAndUpdate(postId, { processingStatus: 'failed' });
      throw error;
  } finally {
      // Cleanup
      if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath).catch(() => {});
      if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath).catch(() => {});
  }
}, { connection }) : null;
