
'use client';

// This file is obsolete and its functionality has been integrated into the Firebase Provider.
// It is kept for now to prevent breaking imports, but should be removed in the future.
import { useUser as useFirebaseUser } from '@/firebase';
import type { User } from './types';
import { users } from './data';
import { useData } from '@/app/(app)/data-provider';

// The useAuth hook is now a proxy to the more comprehensive useUser hook from the Firebase provider.
export function useAuth() {
  const { user: firebaseUser, isUserLoading } = useFirebaseUser();
  const { users } = useData();
  
  // This hook is now simplified because the main layout handles fetching the detailed user profile.
  // We can't directly return the User type here without causing dependency cycles or prop drilling.
  // The layout pattern is now the correct way to handle this.
  const user = users.find(u => u.email === firebaseUser?.email);
  
  // To maintain compatibility with components that use this hook, we can return a partial user object.
  // The full user object with roles is supplied by the DataProvider/layout now.
  return { user: user as User | null, isLoading: isUserLoading };
}
