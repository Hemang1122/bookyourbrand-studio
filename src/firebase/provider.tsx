
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { firebaseConfig } from '@/firebase/config';

interface FirebaseProviderProps {
  children: ReactNode;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// React Context
const FirebaseContext = createContext<FirebaseContextServices | undefined>(undefined);
const UserAuthContext = createContext<UserAuthState | undefined>(undefined);


// This holds the singleton instance of the firebase services
let firebaseServices: FirebaseContextServices | null = null;

function initializeFirebaseOnce(): FirebaseContextServices {
    if (firebaseServices) {
        return firebaseServices;
    }
    
    let app;
    if (!getApps().length) {
        try {
          // Firebase App Hosting auto-config
          app = initializeApp();
        } catch (e) {
          // Fallback for local dev
          app = initializeApp(firebaseConfig);
        }
    } else {
        app = getApp();
    }

    const auth = getAuth(app);
    const firestore = getFirestore(app);

    firebaseServices = { firebaseApp: app, auth, firestore };
    return firebaseServices;
}


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  // Services are guaranteed to be initialized here.
  const services = useMemo(() => initializeFirebaseOnce(), []);

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    // Services are available from the useMemo call.
    const { auth } = services;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { 
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { 
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); 
  }, [services]); 

  return (
    <FirebaseContext.Provider value={services}>
      <UserAuthContext.Provider value={userAuthState}>
        <FirebaseErrorListener />
        {children}
      </UserAuthContext.Provider>
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services.
 * Throws error if used outside provider.
 * This hook should NOT be used to get user state. Use useUser() instead.
 */
export const useFirebase = (): FirebaseContextServices => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 */
export const useUser = (): UserAuthState => {
  const context = useContext(UserAuthContext);
   if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return context;
};

