import admin, { ServiceAccount } from 'firebase-admin';

const parseServiceAccount = (): ServiceAccount | undefined => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    return undefined;
  }

  try {
    return JSON.parse(serviceAccount) as ServiceAccount;
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
  }
};

import fs from 'fs';
import path from 'path';

const buildCredential = (): admin.credential.Credential => {
  const parsedServiceAccount = parseServiceAccount();

  if (parsedServiceAccount) {
    return admin.credential.cert(parsedServiceAccount);
  }

  // Check if GOOGLE_APPLICATION_CREDENTIALS is set
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }

  // Auto-discover service account file in root
  try {
    const rootDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(rootDir);
    const serviceAccountFile = files.find((file) => 
      file.endsWith('.json') && file.includes('firebase-adminsdk')
    );

    if (serviceAccountFile) {
      const filePath = path.join(rootDir, serviceAccountFile);
      console.log(`Auto-discovered Firebase service account: ${serviceAccountFile}`);
      const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return admin.credential.cert(serviceAccount);
    }
  } catch (error) {
    console.warn('Failed to auto-discover Firebase service account:', error);
  }

  return admin.credential.applicationDefault();
};

export const initializeFirebase = (): admin.app.App => {
  if (!admin.apps.length) {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
      throw new Error('FIREBASE_STORAGE_BUCKET is not defined');
    }

    admin.initializeApp({
      credential: buildCredential(),
      storageBucket,
    });
  }

  return admin.app();
};

export type FirebaseBucket = ReturnType<admin.storage.Storage['bucket']>;

export const getFirebaseBucket = (): FirebaseBucket => initializeFirebase().storage().bucket();

