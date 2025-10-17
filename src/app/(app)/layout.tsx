import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { ModeToggle } from '@/components/mode-toggle';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainNav userRole={user.role} />
          </SidebarContent>
          <SidebarFooter>
            {/* Can add footer items here */}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex-1" />
            <ModeToggle />
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
