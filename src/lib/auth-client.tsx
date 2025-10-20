
'use client';

// This file is obsolete and its functionality has been integrated into the Firebase Provider.
// It is kept for now to prevent breaking imports, but should be removed in the future.
import { useUser as useFirebaseUser } from '@/firebase';
import type { User } from './types';

// The useAuth hook is now a proxy to the more comprehensive useUser hook from the Firebase provider.
export function useAuth() {
  const { user: firebaseUser, isUserLoading } = useFirebaseUser();
  
  // The goal is to adapt the Firebase User object to the application's User type.
  // For this mock, we assume the user object from the DataProvider is the source of truth.
  // In a real app, you would fetch the user profile from Firestore here based on firebaseUser.uid
  // and map it to the application's User type.
  
  // This hook is now simplified because the main layout handles fetching the detailed user profile.
  // We can't directly return the User type here without causing dependency cycles or prop drilling.
  // The layout pattern is now the correct way to handle this.
  
  // To maintain compatibility with components that use this hook, we can return a partial user object.
  // The full user object with roles is supplied by the DataProvider/layout now.
  return { user: firebaseUser as User | null, isLoading: isUserLoading };
}
