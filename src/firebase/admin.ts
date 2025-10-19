
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// It is important that we initialize the app once!
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // The SERVICE_ACCOUNT environment variable is automatically populated
  // by Firebase App Hosting.
  if (process.env.SERVICE_ACCOUNT) {
    return initializeApp();
  } else {
    // If not in a managed environment, fall back to the client-side config.
    // Note: This is less secure and should only be used for development
    // or in environments where service accounts are not feasible.
    return initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}
