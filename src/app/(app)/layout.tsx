
'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useUser as useFirebaseUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/firebase/provider';

function AppLayoutAuthenticated({ children }: { children: ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!authUser) {
      redirect('/login');
      return;
    }

    if (!firestore) {
        setIsAppUserLoading(false);
        return;
    }
    
    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef)
      .then(async (userDoc) => {
        if (userDoc.exists()) {
          setAppUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          // This is a first-time login or sign-up. Create a default profile.
          const newUser: User = {
            id: authUser.uid,
            email: authUser.email || 'no-email@example.com',
            name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
            role: 'team', // Default role for new sign-ups. Could be 'client'
            avatar: 'avatar-3', // A default avatar
            username: authUser.email?.split('@')[0] || `user${Date.now()}`,
          };
          await setDoc(userRef, newUser);
          setAppUser(newUser);
        }
      })
      .catch(error => {
        console.error("Error fetching user document:", error);
        setAppUser(null);
      })
      .finally(() => {
        setIsAppUserLoading(false);
      });

  }, [authUser, isAuthLoading, firestore]);

  const isLoading = isAuthLoading || isAppUserLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Workspace...</span>
        </div>
      </div>
    );
  }
  
  if (!appUser) {
    redirect('/login');
    return null;
  }
  
  return (
    <AuthProvider user={appUser}>
      <AppLayoutClient>
        {children}
      </AppLayoutClient>
    </AuthProvider>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AppLayoutAuthenticated>
                {children}
            </AppLayoutAuthenticated>
        </FirebaseClientProvider>
    )
}
