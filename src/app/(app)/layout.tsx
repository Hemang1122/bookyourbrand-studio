import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';

function AppHeader() {
    const { open, setOpen } = useSidebar();
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex-1" />
            <ModeToggle />
            <UserNav />
        </header>
    )
}

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
          <AppHeader />
          <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
