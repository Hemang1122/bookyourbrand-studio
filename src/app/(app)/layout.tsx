
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
    if (isAuthLoading) {
      return; 
    }
    
    if (!authUser) {
      redirect('/login');
      return;
    }

    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef).then(userDoc => {
        if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
             setUser({
                id: authUser.uid,
                email: authUser.email || 'No Email',
                name: authUser.displayName || 'New User',
                role: 'client',
                avatar: '',
                username: authUser.email?.split('@')[0] || 'newuser',
            });
        }
    }).finally(() => {
        setIsUserDocLoading(false);
    });

  }, [authUser, isAuthLoading, firestore]);

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
