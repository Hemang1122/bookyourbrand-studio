'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import type { User } from '@/lib/types';


// --- Core Firebase Services Context (for initialization) ---
interface FirebaseServicesContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseServicesContext = createContext<FirebaseServicesContextState | undefined>(undefined);


/**
 * FirebaseProvider: Manages and provides the CORE Firebase service instances (app, auth, firestore).
 * This is primarily for use with the client-side initialization.
 */
export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp | null; firestore: Firestore | null; auth: Auth | null; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const servicesContextValue = useMemo((): FirebaseServicesContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
    };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseServicesContext.Provider value={servicesContextValue}>
        <FirebaseErrorListener />
        {children}
    </FirebaseServicesContext.Provider>
  );
};


// --- Application-Level Auth Context (for authenticated User profile) ---
interface AuthContextState {
    user: User | null;
}
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * AuthProvider: Stores and provides the fully-vetted application user profile.
 * This should wrap the authenticated parts of the app.
 */
export const AuthProvider: React.FC<{ user: User; children: ReactNode }> = ({ user, children }) => {
    const value = useMemo(() => ({ user }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// --- HOOKS ---

/**
 * useAuth: Hook to get the current authenticated application user profile.
 * Throws an error if used outside of an AuthProvider.
 */
export const useAuth = (): { user: User | null } => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // This can happen transiently during loading, so we return null instead of throwing
        return { user: null };
    }
    return context;
};

/**
 * useFirebaseServices: Hook to access the raw Firebase service instances.
 * This is for internal use or when you need the bare Firebase SDK objects.
 */
export const useFirebaseServices = (): FirebaseServicesContextState => {
  const context = useContext(FirebaseServicesContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  return context;
};

/**
 * useFirestore: Convenience hook to get just the Firestore instance.
 */
export const useFirestore = (): Firestore | null => {
    const { firestore } = useFirebaseServices();
    return firestore;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  if(!memoized) return memoized;

  try {
    (memoized as MemoFirebase<T>).__memo = true;
  } catch {}
  
  return memoized;
}
