
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Briefcase,
  GitCommit,
  CalendarDays,
  BarChart,
  MessageSquare,
  FileText,
  CreditCard,
  Package,
  RefreshCw,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/types';
import { useSidebar } from '@/components/ui/sidebar';
import { useData } from '@/app/(app)/data-provider';
import { useMemo } from 'react';
import { useAuth } from '@/firebase/provider';
import { Badge } from './ui/badge';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'team', 'client'], id: 'nav-dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'team', 'client'], id: 'nav-projects' },
  { href: '/time-tracker', icon: Clock, label: 'Time Tracker', roles: ['team'], id: 'nav-time-tracker' },
  { href: '/admin/time-tracking', icon: Clock, label: 'Team Tracking', roles: ['admin'], id: 'nav-admin-time-tracking' },
  { href: '/packages', icon: CreditCard, label: 'Packages', roles: ['client'], id: 'nav-packages' },
  { href: '/admin/packages', icon: Package, label: 'Package Mgmt', roles: ['admin'], id: 'nav-admin-packages' },
  { href: '/admin/migration', icon: RefreshCw, label: 'Migration Tool', roles: ['admin'], id: 'nav-admin-migration' },
  { href: '/admin/documents', icon: ClipboardCheck, label: 'Doc Approvals', roles: ['admin'], id: 'nav-admin-documents' },
  { href: '/clients', icon: Briefcase, label: 'Clients', roles: ['admin'], id: 'nav-clients' },
  { href: '/team', icon: Users, label: 'Team', roles: ['admin'], id: 'nav-team' },
  { href: '/documents', icon: FileText, label: 'Documents', roles: ['client'], id: 'nav-documents' },
  { href: '/profile', icon: Users, label: 'Profile', roles: ['admin', 'team', 'client'], id: 'nav-profile' },
  { href: '/support', icon: MessageSquare, label: 'Support', roles: ['admin', 'client', 'team'], id: 'nav-support' },
  { href: '/scrum', icon: GitCommit, label: 'Scrum', roles: ['admin', 'team'], id: 'nav-scrum' },
  { href: '/schedule', icon: CalendarDays, label: 'Schedule', roles: ['admin'], id: 'nav-schedule' },
  { href: '/reports', icon: BarChart, label: 'Reports', roles: ['admin'], id: 'nav-reports' },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'team', 'client'], id: 'nav-settings' },
];

export function MainNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { chats } = useData();

  const unreadSupportCount = useMemo(() => {
    if (!user || !chats) return 0;
    return chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
  }, [chats, user]);

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));
  const { isMobile } = useSidebar();

  return (
    <nav className="flex flex-col">
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="relative" id={item.id}>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <item.icon className="h-5 w-5" />
                 {isMobile && <span>{item.label}</span>}
                 {item.href === '/support' && unreadSupportCount > 0 && isMobile && (
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{unreadSupportCount > 99 ? '99+' : unreadSupportCount}</Badge>
                 )}
              </SidebarMenuButton>
              {item.href === '/support' && unreadSupportCount > 0 && !isMobile && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0" id={item.id === 'nav-support' ? 'nav-support' : undefined}>{unreadSupportCount > 99 ? '99+' : unreadSupportCount}</Badge>
              )}
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
