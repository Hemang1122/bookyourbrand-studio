
import { initializeApp, getApp, getApps, type App, type ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

// It is important that we initialize the app once!
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // The SERVICE_ACCOUNT environment variable is automatically populated
  // by Firebase App Hosting when deployed.
  if (process.env.SERVICE_ACCOUNT) {
    // In a deployed environment, initialize without explicit credentials.
    return initializeApp();
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // For local development, use the service account JSON from the environment variable.
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string);
      return initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Make sure it is a valid JSON string.',
        e
      );
      throw new Error('Firebase Admin SDK initialization failed due to invalid service account JSON.');
    }
  } else {
    // If neither environment variable is set, the configuration is incomplete.
    console.error('Firebase Admin SDK initialization failed. Set either SERVICE_ACCOUNT (for App Hosting) or FIREBASE_SERVICE_ACCOUNT_JSON (for local dev) environment variables.');
    throw new Error('Firebase Admin SDK is not configured. See server logs for details.');
  }
}
