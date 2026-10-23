'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * Use a persistent, multi-tab local cache in the browser. Reopening or reloading the
 * CRM resumes listeners from the cache instead of re-downloading every document,
 * and several open tabs share one set of listeners. Both cut Firestore read costs.
 * Falls back to the default instance on the server or if Firestore already exists.
 */
function getAppFirestore(app: FirebaseApp): Firestore {
  if (typeof window === 'undefined') return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}

export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getAppFirestore(app);
  const database = getDatabase(app);
  const auth = getAuth(app);
  const functions = getFunctions(app);

  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    try {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      connectDatabaseEmulator(database, 'localhost', 9000);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      // connectAuthEmulator is not included here, assuming production auth is used
    } catch (e) {
      console.log('Could not connect to emulators', e);
    }
  }

  return {
    firebaseApp: app,
    auth,
    firestore,
    database,
    functions,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
export * from './rtdb/use-presence';
export * from './rtdb/use-user-status';
export * from './rtdb/use-typing-indicator';
