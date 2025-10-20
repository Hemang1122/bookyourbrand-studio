'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useUser as useFirebaseUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function AppLayoutAuthenticated({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isUserDocLoading, setIsUserDocLoading] = useState(true);

  useEffect(() => {
    // Wait until Firebase auth state is resolved.
    if (isAuthLoading) {
      return; 
    }
    
    // If no user is authenticated, redirect to login.
    if (!authUser) {
      redirect('/login');
      return;
    }

    // Auth user exists, now fetch their profile from Firestore.
    const fetchUserDoc = async () => {
      if (!firestore) {
        console.error("Firestore service is not available.");
        setIsUserDocLoading(false);
        return;
      };
      
      setIsUserDocLoading(true);
      const userRef = doc(firestore, 'users', authUser.uid);
      
      try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // This case is for newly registered users who might not have a doc yet.
          // Create a temporary profile.
          console.warn("User document not found in Firestore. Creating temporary profile.");
          setUser({
            id: authUser.uid,
            email: authUser.email || 'No Email',
            name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
            role: 'client', // Default role for safety
            avatar: '',
            username: authUser.email?.split('@')[0] || 'newuser',
          });
        }
      } catch (error) {
          console.error("Error fetching user document:", error);
      } finally {
        setIsUserDocLoading(false);
      }
    };

    fetchUserDoc();

  }, [authUser, isAuthLoading, firestore]);

  // Combined loading state.
  const isStillLoading = isAuthLoading || isUserDocLoading;

  if (isStillLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Workspace...</span>
        </div>
      </div>
    );
  }
  
  // If after all loading, there's still no user profile, something is wrong.
  if (!user) {
    // This could happen if Firestore fetch fails or if authUser exists but doc doesn't.
    // Redirecting to login is a safe fallback.
    redirect('/login');
    return null;
  }

  // Once we have the full user object, render the main layout.
  return <AppLayoutClient user={user}>{children}</AppLayoutClient>;
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <FirebaseClientProvider>
            <AppLayoutAuthenticated>
                {children}
            </AppLayoutAuthenticated>
        </FirebaseClientProvider>
    )
}
