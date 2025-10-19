
import { initializeApp, getApp, getApps, type App, type ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

// It is important that we initialize the app once!
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // The SERVICE_ACCOUNT environment variable is automatically populated
  // by Firebase App Hosting.
  if (process.env.SERVICE_ACCOUNT) {
    return initializeApp();
  }
  
  // If not on App Hosting, we need to use a service account file.
  // This is for local development.
  // The service account JSON is parsed from an environment variable.
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string);
    return initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set correctly in your environment.', e);
    // Throw an error to prevent the app from running with a broken config
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}
