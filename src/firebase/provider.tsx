
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// 1. DEFINE THE SHAPE OF THE CONTEXT
interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// 2. CREATE THE CONTEXT
// The context is created with `undefined` because we will only use it
// inside the provider, where it is guaranteed to have a value.
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);


// 3. CREATE THE PROVIDER COMPONENT
export function FirebaseProvider({
  children,
}: {
  children: ReactNode;
}) {

  // Use useMemo to initialize Firebase only once per application lifecycle.
  // This is the core of making Firebase services available reliably.
  const firebaseApp = useMemo(() => {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }, []);

  const firestore = useMemo(() => getFirestore(firebaseApp), [firebaseApp]);
  const auth = useMemo(() => getAuth(firebaseApp), [firebaseApp]);

  // The final context value object that will be provided to all children.
  // It's also memoized to prevent unnecessary re-renders in consumer components.
  const value = useMemo(
    () => ({
      firebaseApp,
      firestore,
      auth,
    }),
    [firebaseApp, firestore, auth]
  );

  return (
    <FirebaseContext.Provider value={value}>
        <FirebaseErrorListener />
        {children}
    </FirebaseContext.Provider>
  );
}

// 4. CREATE THE PRIMARY HOOK TO ACCESS THE FULL CONTEXT
// This hook is the main entry point for components to get Firebase services.
function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    // This error ensures that you can't use the hook outside of the provider,
    // which prevents runtime errors.
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}


// 5. CREATE CONVENIENCE HOOKS FOR SPECIFIC SERVICES
// These hooks make it easier to get just the service you need,
// leading to cleaner component code.

/**
 * A hook to get the initialized Firestore instance.
 * @returns {Firestore} The Firestore service object.
 */
export function useFirestore() {
    const { firestore } = useFirebase();
    return firestore;
}

/**
 * A hook to get the initialized Firebase Auth instance.
 * @returns {Auth} The Firebase Auth service object.
 */
export function useAuth() {
    const { auth } = useFirebase();
    return auth;
}
