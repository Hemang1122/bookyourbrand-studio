
'use client';
import { users } from '@/lib/data';
import AppLayoutClient from './layout-client';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a mock authentication guard using sessionStorage.
    // In a real app, you would use a proper authentication solution like httpOnly cookies.
    const mockUserId = sessionStorage.getItem('mockUserId');
    
    if (!mockUserId) {
      redirect('/login');
      return;
    }

    const foundUser = users.find((u) => u.id === mockUserId);
    
    if (foundUser) {
      setUser(foundUser);
    } else {
      // If user ID from session is invalid, clear it and redirect
      sessionStorage.removeItem('mockUserId');
      redirect('/login');
      return;
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // This should be handled by the redirect in useEffect, but as a fallback:
    return null;
  }

  return (
    <FirebaseClientProvider>
        <AppLayoutClient user={user}>{children}</AppLayoutClient>
    </FirebaseClientProvider>
  );
}
