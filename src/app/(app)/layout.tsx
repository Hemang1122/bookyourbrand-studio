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
    // Wait until Firebase auth state is resolved and Firestore is available.
    if (isAuthLoading || !firestore) {
      return;
    }

    if (!authUser) {
      // If no user is authenticated, redirect to login immediately.
      redirect('/login');
      return;
    }

    // Auth user is present, try to fetch their app-specific profile from Firestore.
    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef)
      .then(async (userDoc) => {
        if (userDoc.exists()) {
          // User profile exists in Firestore, use it.
          const existingUser = { id: userDoc.id, ...userDoc.data() } as User;
          setAppUser(existingUser);
        } else {
          // This is a first-time login for this user.
          // Create a default user profile in Firestore.
          const newUser: User = {
            id: authUser.uid,
            email: authUser.email || 'no-email@example.com',
            name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
            role: 'client', // Default role for new sign-ups. Admins can change this.
            avatar: `avatar-${Math.ceil(Math.random() * 3)}`,
            username: authUser.email?.split('@')[0] || `user${Date.now()}`,
          };
          
          // Also create a corresponding client record if they are a client
          if (newUser.role === 'client') {
            const clientRef = doc(firestore, 'clients', newUser.id);
             const newClient = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                company: `${newUser.name}'s Company`,
                avatar: newUser.avatar,
             };
            await setDoc(clientRef, newClient);
          }

          await setDoc(userRef, newUser);
          setAppUser(newUser); // Use the newly created profile.
        }
      })
      .catch(error => {
        console.error("Error fetching user document:", error);
        // Handle error, maybe show a message or redirect
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
    // If after all loading, there's still no user, something went wrong.
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
