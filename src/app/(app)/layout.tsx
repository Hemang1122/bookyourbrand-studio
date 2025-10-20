
'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useUser as useFirebaseUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { users as mockUsers } from '@/lib/data'; // Fallback mock data

function AppLayoutAuthenticated({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebaseUser();
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

    // Auth user exists, now fetch their profile from our mock data as a fallback.
    // In a real app, you would fetch from Firestore.
    const userProfile = mockUsers.find(u => u.email === authUser.email);
    
    if (userProfile) {
        setUser(userProfile);
    } else {
        // Fallback for users not in mock data (like new signups)
        setUser({
            id: authUser.uid,
            email: authUser.email || 'No Email',
            name: authUser.displayName || 'New User',
            role: 'client', // Default role for safety
            avatar: '',
            username: authUser.email?.split('@')[0] || 'newuser',
        });
    }
    setIsUserDocLoading(false);

  }, [authUser, isAuthLoading]);

  // Combined loading state.
  const isStillLoading = isAuthLoading || isUserDocLoading;

  if (isStillLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Workspace...</span>
        </div>
      </div>
    );
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
