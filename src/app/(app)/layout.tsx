
'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

function AppLayoutAuthenticated({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait until Firebase Auth has initialized
    }
    
    if (!authUser) {
      redirect('/login');
      return;
    }

    const fetchUserDoc = async () => {
      if (!firestore) return;
      const userRef = doc(firestore, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUser(userSnap.data() as User);
      } else {
        // This case might happen if the user document hasn't been created yet.
        // For now, we can create a temporary user object.
        console.warn("User document not found in Firestore. Creating temporary profile.");
        setUser({
          id: authUser.uid,
          email: authUser.email || 'No Email',
          name: authUser.displayName || 'New User',
          role: 'client', // Default role
          avatar: '',
          username: authUser.email?.split('@')[0] || 'newuser',
        });
      }
      setLoading(false);
    };

    fetchUserDoc();

  }, [authUser, isAuthLoading, firestore]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // This could happen if fetching fails, redirect to login as a fallback.
    redirect('/login');
    return null;
  }

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
