
'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useUser as useFirebaseUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
        
        // Backwards compatibility/safety check: if the name is a placeholder but auth has a real name, update it.
        if (finalUser.name !== authUser.displayName && authUser.displayName) {
            finalUser.name = authUser.displayName;
            await updateDoc(userRef, { name: authUser.displayName });
        }
      } else {
        // This is a first-time sign-up. We need to create their profile.
        const userEmail = authUser.email || '';
        const name = authUser.displayName || userEmail.split('@')[0];
        
        // Determine role based on email domain
        let role: User['role'] = 'client';
        if (userEmail.endsWith('@bookyourbrands.com')) {
          role = 'admin';
        } else if (userEmail.endsWith('@example.com')) {
          role = 'team';
        }

        finalUser = {
          id: authUser.uid,
          email: userEmail,
          name: name,
          role: role,
          avatar: `avatar-${Math.floor(Math.random() * 3) + 2}`, // Assign a valid random avatar
          username: name.toLowerCase().replace(/\s/g, ''),
        };
        
        // Only create a 'client' record if the user is actually a client
        if (role === 'client') {
            const clientRef = doc(firestore, 'clients', finalUser.id);
            const newClient = {
                id: finalUser.id,
                name: finalUser.name,
                email: finalUser.email,
                company: `${finalUser.name}'s Company`,
                avatar: finalUser.avatar,
            };
            await setDoc(clientRef, newClient);
        }

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
