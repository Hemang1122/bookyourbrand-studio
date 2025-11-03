
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We can't do anything until Firebase auth is resolved and Firestore is ready.
    if (isAuthLoading || !firestore) {
      return;
    }

    // If Firebase says there's no user, they need to log in.
    if (!authUser) {
      redirect('/login');
      return;
    }
    
    // At this point, we have an authenticated user from Firebase.
    // Now, we need to get their application-specific profile from Firestore.
    const userRef = doc(firestore, 'users', authUser.uid);
    
    getDoc(userRef).then(async (userDoc) => {
      let finalUser: User;

      if (userDoc.exists()) {
        // The user profile already exists in Firestore, so we'll use it.
        finalUser = { id: userDoc.id, ...userDoc.data() } as User;
      } else {
        // This is a first-time sign-up. We need to create their profile.
        // We create a default profile. The role is 'client' by default.
        finalUser = {
          id: authUser.uid,
          email: authUser.email!,
          name: authUser.displayName || authUser.email!.split('@')[0],
          role: 'client', // Default role for any new sign-up
          avatar: `avatar-${Math.ceil(Math.random() * 3)}`,
          username: authUser.displayName?.toLowerCase().replace(/\s/g, '') || authUser.email!.split('@')[0],
        };
        
        // Also create a corresponding client record in the 'clients' collection
        const clientRef = doc(firestore, 'clients', finalUser.id);
        const newClient = {
            id: finalUser.id,
            name: finalUser.name,
            email: finalUser.email,
            company: `${finalUser.name}'s Company`,
            avatar: finalUser.avatar,
        };
        await setDoc(clientRef, newClient);

        // Save the new user profile to the 'users' collection
        await setDoc(userRef, finalUser);
      }
      
      setAppUser(finalUser);
      setIsLoading(false);

    }).catch(error => {
        console.error("Error fetching or creating user document:", error);
        // If something goes wrong, we can't proceed.
        redirect('/login');
    });

  }, [authUser, isAuthLoading, firestore]);

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
    // If we're done loading and still have no app user, something went wrong.
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
