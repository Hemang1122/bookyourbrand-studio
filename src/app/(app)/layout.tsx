
'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import AppLayoutClient from './layout-client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userQuery = useMemoFirebase(() => {
    if (!firestore || !firebaseUser?.email) return null;
    return query(collection(firestore, 'users'), where('email', '==', firebaseUser.email));
  }, [firestore, firebaseUser?.email]);

  const { data: appUsers, isLoading: isAppUserLoading } = useCollection<AppUser>(userQuery);
  const appUser = appUsers?.[0];
  
  useEffect(() => {
    if (!isUserLoading && !firebaseUser) {
      redirect('/login');
    }
  }, [firebaseUser, isUserLoading]);

  if (isUserLoading || isAppUserLoading || (firebaseUser && !appUser)) {
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
