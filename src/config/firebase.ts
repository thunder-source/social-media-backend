import admin from 'firebase-admin';

const buildCredential = (): admin.credential.Credential => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    return admin.credential.cert(JSON.parse(serviceAccount) as admin.ServiceAccount);
  }

  return admin.credential.applicationDefault();
};

export const initializeFirebase = (): admin.app.App => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: buildCredential(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  return admin.app();
};

export const getFirebaseBucket = () => initializeFirebase().storage().bucket();

