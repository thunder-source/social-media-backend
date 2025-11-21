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
 * @returns Compressed video buffer
 */
export const compressVideo = async (fileBuffer: Buffer, originalName: string): Promise<Buffer> => {
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
        .size('?x720') // Resize to 720p max height, keeping aspect ratio
        .videoBitrate('1000k') // Target bitrate 1000kbps
        .audioCodec('aac')
        .audioBitrate('128k')
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
