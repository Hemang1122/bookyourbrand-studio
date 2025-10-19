
'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import AppLayoutClient from './layout-client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser?.uid) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser?.uid]);

  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUser>(userDocRef);
  
  useEffect(() => {
    if (!isUserLoading && !firebaseUser) {
      redirect('/login');
    }
  }, [firebaseUser, isUserLoading]);

  // Combined loading state: wait for Firebase Auth and Firestore doc read
  if (isUserLoading || (firebaseUser && isAppUserLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // After loading, if there's still no user profile, redirect.
  // This handles the case where the user exists in Auth but not in our 'users' collection.
  if (firebaseUser && !appUser) {
     console.warn("Authenticated user not found in 'users' collection. Redirecting to login.");
     // We must also sign the user out to prevent a loop if they try to come back
      import('firebase/auth').then(({getAuth}) => getAuth().signOut());
      redirect('/login');
      return null;
  }
  
  if (!firebaseUser || !appUser) {
    // This is the main redirect path if user is not authenticated after loading.
    // The useEffect above will also catch this, but this is a safeguard.
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Once we have the appUser, we pass it to the AppLayoutClient
  return <AppLayoutClient user={appUser}>{children}</AppLayoutClient>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AuthGuard>{children}</AuthGuard>
  );
}
