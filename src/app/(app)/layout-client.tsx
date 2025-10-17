'use client';

import type { User } from '@/lib/types';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { UserNavClient } from '@/components/user-nav-client';
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainNav } from '@/components/main-nav';
import { AuthProvider } from '@/lib/auth-client';
import { DataProvider, useData } from './data-provider';
import { Button } from '@/components/ui/button';
import { BookOpenCheck } from 'lucide-react';
import { DailyReportDialog } from './components/daily-report-dialog';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import { NotificationSound } from '@/components/ui/notification-sound';
import { doc } from 'firebase/firestore';
import React from 'react';

function AppHeader({user}: {user: User}) {
    const { open, setOpen } = useSidebar();
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex-1" />
            {user?.role === 'admin' && (
              <DailyReportDialog>
                <Button variant="outline" size="sm">
                  <BookOpenCheck className="mr-2 h-4 w-4" />
                  Daily Report
                </Button>
              </DailyReportDialog>
            )}
            <ModeToggle />
            <UserNavClient user={user} />
        </header>
    )
}

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { playNotification, notificationPlayed } = useData();

  return (
    <>
      {children}
      <NotificationSound play={playNotification} onPlayed={notificationPlayed} />
    </>
  );
}


export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Create a memoized reference to the user's document in Firestore.
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  // Use the useDoc hook to get the user profile data from Firestore.
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  
  // Memoize the user profile object to prevent re-renders
  const user = React.useMemo(() => userProfile, [userProfile]);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    // If Firebase has confirmed there's no user, redirect to login.
    redirect('/login');
  }
  
  if (firebaseUser && !user) {
    // This can happen briefly while the user document is being created after sign-up.
    // Or if the document failed to be created.
    // We log an error and redirect to login to be safe.
    console.error("User is authenticated with Firebase but profile not found in Firestore.");
    redirect('/login');
  }

  // At this point, we should have a valid user object from Firestore.
  if (!user) {
     // This is our final fallback. Should not be reached if logic is correct.
     return (
       <div className="flex min-h-screen w-full items-center justify-center">
        <p>Could not load user profile. Please try logging in again.</p>
       </div>
    );
  }

  return (
    <AuthProvider user={user}>
      <DataProvider>
        <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Sidebar>
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea className="h-full">
                    <MainNav userRole={user.role} />
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter>
                {/* Can add footer items here */}
            </SidebarFooter>
            </Sidebar>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <AppHeader user={user} />
            <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
                <AppLayoutContent>{children}</AppLayoutContent>
            </main>
            </div>
        </div>
        </SidebarProvider>
      </DataProvider>
    </AuthProvider>
  );
}
