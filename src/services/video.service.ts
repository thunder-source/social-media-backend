import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

// Set ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

/**
 * Compress a video buffer using ffmpeg
 * @param fileBuffer - The video file buffer
 * @param originalName - The original filename
 * @returns Compressed video buffer (or original if compression is disabled)
 */
export const compressVideo = async (fileBuffer: Buffer, originalName: string): Promise<Buffer> => {
  // Check if video compression is enabled via environment variable
  const isCompressionEnabled = process.env.ENABLE_VIDEO_COMPRESSION === 'true';
  
  if (!isCompressionEnabled) {
    console.log('Video compression is disabled. Returning original video.');
    return fileBuffer;
  }

  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-z0-9.]/gi, '_');
  const inputPath = path.join(tempDir, `input-${timestamp}-${safeName}`);
  const outputPath = path.join(tempDir, `output-${timestamp}-${safeName}`);

  try {
    // Write buffer to temp file
    await writeFile(inputPath, fileBuffer);

    // Compress video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .size('?x480') // Resize to 480p max height for better compression
        .videoBitrate('500k') // Target bitrate 500kbps
        .audioCodec('aac')
        .audioBitrate('64k') // Lower audio bitrate
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .run();
    });

    // Read compressed file
    const compressedBuffer = await readFile(outputPath);
    return compressedBuffer;

  } catch (error) {
    console.error('Video compression error:', error);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) await unlink(inputPath);
      if (fs.existsSync(outputPath)) await unlink(outputPath);
    } catch (err) {
      console.error('Error cleaning up temp files:', err);
    }
  }
};
