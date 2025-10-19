
'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import AppLayoutClient from './layout-client';
import { FirebaseClientProvider } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { users } from '@/lib/data';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();

  // This logic is crucial: it finds the corresponding app user profile
  // based on the authenticated Firebase user's email.
  const appUser: AppUser | undefined = firebaseUser?.email
    ? users.find(u => u.email === firebaseUser.email)
    : undefined;

  useEffect(() => {
    if (!isUserLoading && !firebaseUser) {
      redirect('/login');
    }
  }, [firebaseUser, isUserLoading]);

  if (isUserLoading || !appUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Once we have the appUser, we pass it to the AppLayoutClient
  return <AppLayoutClient user={appUser}>{children}</AppLayoutClient>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>{children}</AuthGuard>
    </FirebaseClientProvider>
  );
}
