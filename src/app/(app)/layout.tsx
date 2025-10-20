
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
    // Wait until Firebase Auth has resolved.
    if (isAuthLoading || !firestore) {
      return;
    }
    
    // If no user is authenticated after loading, redirect to login.
    if (!authUser) {
      redirect('/login');
      return;
    }

    // Auth user exists, now fetch or create our application user profile.
    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef)
      .then(async (userDoc) => {
        if (userDoc.exists()) {
          // User profile exists, set it as our app user.
          setAppUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          // First time login for this user, create a default profile.
          const newUser: User = {
            id: authUser.uid,
            email: authUser.email || 'no-email@example.com',
            name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
            role: 'client', // Default role for new sign-ups.
            avatar: 'avatar-4', // A default avatar
            username: authUser.email?.split('@')[0] || `user${Date.now()}`,
          };
          // Save the new user profile to Firestore.
          await setDoc(userRef, newUser);
          setAppUser(newUser);
        }
      })
      .catch(error => {
        console.error("Error fetching user document:", error);
        // Handle error, maybe redirect to an error page.
      })
      .finally(() => {
        setIsAppUserLoading(false);
      });

  }, [authUser, isAuthLoading, firestore]);

  // Combined loading state.
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
    // This case handles the brief moment before the redirect happens or if something went wrong.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Finalizing...</span>
        </div>
      </div>
    );
  }
  
  // Once we have the full user profile, we provide it to the rest of the app.
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
