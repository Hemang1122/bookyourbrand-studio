
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

  if (isUserLoading || (firebaseUser && isAppUserLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!appUser) {
     // This can happen briefly during the transition or if the user is not in our system.
     // Or if the user exists in Firebase Auth but not in our 'users' collection.
     if(!isUserLoading && firebaseUser) {
        console.warn("Authenticated user not found in 'users' collection. Redirecting to login.");
        redirect('/login'); // Or a page that says "access denied"
     }

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
