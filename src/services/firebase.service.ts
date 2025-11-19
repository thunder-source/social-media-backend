import { getFirebaseBucket } from '../config/firebase';

export const uploadToFirebase = async (
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  const bucket = getFirebaseBucket();
  const file = bucket.file(fileName);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
};

