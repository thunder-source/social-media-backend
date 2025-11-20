import { getFirebaseBucket } from '../config/firebase';

/**
 * Upload a file to Firebase Storage
 * @param file - Express.Multer.File object
 * @param folder - Folder path in Firebase Storage (e.g., 'posts', 'avatars')
 * @returns Public URL of the uploaded file
 */
export const uploadToFirebase = async (
  file: Express.Multer.File,
  folder: string = 'posts'
): Promise<string> => {
  const bucket = getFirebaseBucket();
  
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}-${file.originalname}`;
  const firebaseFile = bucket.file(fileName);

  await firebaseFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  await firebaseFile.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

/**
 * Delete a file from Firebase Storage by URL
 * @param url - Public URL of the file to delete
 */
export const deleteFromFirebase = async (url: string): Promise<void> => {
  try {
    const bucket = getFirebaseBucket();
    const filePath = extractFilePathFromUrl(url, bucket.name);
    
    if (!filePath) {
      console.error('Invalid Firebase URL:', url);
      return;
    }

    const file = bucket.file(filePath);
    await file.delete();
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
    // Don't throw error to prevent post deletion failure if file already deleted
  }
};

/**
 * Extract file path from Firebase Storage URL
 * @param url - Firebase Storage public URL
 * @param bucketName - Firebase bucket name
 * @returns File path or null if invalid URL
 */
const extractFilePathFromUrl = (url: string, bucketName: string): string | null => {
  try {
    const pattern = `https://storage.googleapis.com/${bucketName}/`;
    if (url.startsWith(pattern)) {
      return decodeURIComponent(url.substring(pattern.length));
    }
    return null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

