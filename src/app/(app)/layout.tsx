
'use client';
import AppLayoutClient from './layout-client';
import { useEffect, useState, ReactNode }
from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { useAuth as useFirebaseAuth } from '@/lib/auth-client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/firebase/provider';
import { packages as subscriptionPackages } from './settings/billing/packages-data';


function AppLayoutAuthenticated({ children }: { children: ReactNode }) {
  const { user: authUser, loading: isAuthLoading } = useFirebaseAuth();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase auth to stop loading
    if (isAuthLoading) {
      return;
    }

    // If auth is done and there's no user, redirect to login
    if (!authUser) {
      redirect('/login');
      return;
    }

    // If we don't have firestore yet, wait.
    if (!firestore) {
        setIsAppLoading(true);
        return;
    }

    // We have a Firebase user, now get their app-specific profile
    const userRef = doc(firestore, 'users', authUser.uid);
    
    getDoc(userRef).then(async (userDoc) => {
      let finalUser: User;

      if (userDoc.exists()) {
        finalUser = { id: userDoc.id, ...userDoc.data() } as User;
         // Ensure local profile name is synced with auth display name if it's different
        if (finalUser.name !== authUser.displayName && authUser.displayName) {
            finalUser.name = authUser.displayName;
            await updateDoc(userRef, { name: authUser.displayName });
        }
      } else {
        // First-time sign-in, create a new profile in Firestore
        const userEmail = authUser.email || '';
        const name = authUser.displayName || userEmail.split('@')[0] || 'New User';
        
        let role: User['role'] = 'client';
        
        // Specific check for IDs that override standard domain-based logic
        if (authUser.uid === 'K3lFp8oyoYaTpfg4vr4qj1kGl9c2') {
          role = 'client';
        } else if (userEmail.endsWith('@bookyourbrands.com')) {
          role = 'admin';
        } else if (userEmail.endsWith('@example.com')) {
          role = 'team';
        }

        finalUser = {
          id: authUser.uid,
          uid: authUser.uid,
          email: userEmail,
          name: authUser.uid === 'K3lFp8oyoYaTpfg4vr4qj1kGl9c2' ? 'Niddhi' : name,
          role: role,
          avatar: `avatar-${Math.floor(Math.random() * 3) + 2}`,
          username: name.toLowerCase().replace(/\s+/g, ''),
        };
        
        if (role === 'client') {
            const clientRef = doc(firestore, 'clients', finalUser.id);
            const defaultPackage = subscriptionPackages.find(p => p.name === 'Gold');
            const defaultTier = defaultPackage?.tiers?.[0];
            const durationString = defaultTier?.duration || defaultPackage?.duration;
            const maxDuration = durationString ? parseInt(durationString.replace(/[^0-9]/g, ''), 10) : 90;

            const newClient = {
                id: finalUser.id,
                name: finalUser.name,
                email: finalUser.email,
                company: `${finalUser.name}'s Company`,
                avatar: finalUser.avatar,
                packageName: 'Gold' as const,
                reelsLimit: defaultTier?.reels ?? 10,
                reelsCreated: 0,
                maxDuration: isNaN(maxDuration) ? 90 : maxDuration,
                social: {
                    instagram: { connected: false },
                    facebook: { connected: false },
                },
            };
            await setDoc(clientRef, newClient, { merge: true });
        }
        
        await setDoc(userRef, finalUser, { merge: true });
      }
      
      setAppUser(finalUser);
      setIsAppLoading(false);

    }).catch(error => {
        console.error("Error fetching or creating user document:", error);
        redirect('/login');
    });

  }, [authUser, isAuthLoading, firestore]);

  if (isAppLoading) {
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
    // This case should be rare, but as a fallback, if loading is done and
    // there's still no app user, we should redirect.
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
