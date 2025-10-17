
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
import { DataProvider } from './data-provider';
import { Button } from '@/components/ui/button';
import { BookOpenCheck } from 'lucide-react';
import { DailyReportDialog } from './components/daily-report-dialog';
import { useUser, useFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import { users } from '@/lib/data';

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

export default function AppLayoutClient({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const { user: firebaseUser, isUserLoading } = useUser();

  if (isUserLoading) {
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

  // Find the full user profile from our mock data using the authenticated Firebase user's ID.
  // In a real app, this might come from a 'users' collection in Firestore.
  const user = users.find(u => u.email === firebaseUser.email);

  if (!user) {
    // This case can happen if the user exists in Firebase Auth but not in our mock `users` array.
    // We should handle this gracefully. For now, we'll show an error and a way to log out.
     console.error("User not found in data.ts but authenticated with Firebase.");
     redirect('/login');
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
                {children}
            </main>
            </div>
        </div>
        </SidebarProvider>
      </DataProvider>
    </AuthProvider>
  );
}
