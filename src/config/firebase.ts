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

const buildCredential = (): admin.credential.Credential => {
  const parsedServiceAccount = parseServiceAccount();

  if (parsedServiceAccount) {
    return admin.credential.cert(parsedServiceAccount);
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

