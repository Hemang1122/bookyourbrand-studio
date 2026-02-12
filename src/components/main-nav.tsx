
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
  LifeBuoy,
  BarChart,
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
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'team', 'client'] },
  { href: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'team', 'client'] },
  { href: '/clients', icon: Briefcase, label: 'Clients', roles: ['admin'] },
  { href: '/team', icon: Users, label: 'Team', roles: ['admin'] },
  { href: '/scrum', icon: GitCommit, label: 'Scrum', roles: ['admin', 'team'] },
  { href: '/schedule', icon: CalendarDays, label: 'Schedule', roles: ['admin'] },
  { href: '/reports', icon: BarChart, label: 'Reports', roles: ['admin'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'team', 'client'] },
];

export function MainNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { notifications } = useData();

  const unreadSupportCount = useMemo(() => {
    if (!user || !notifications) return 0;
    const unreadChatIds = new Set<string>();
    notifications.forEach(n => {
        if (n.type === 'chat' && !n.readBy.includes(user.id) && n.chatId) {
            unreadChatIds.add(n.chatId);
        }
    });
    return unreadChatIds.size;
  }, [notifications, user]);

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));
  const { isMobile } = useSidebar();

  return (
    <nav className="flex flex-col">
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="relative">
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <item.icon className="h-5 w-5" />
                 {isMobile && <span>{item.label}</span>}
              </SidebarMenuButton>
              {item.href === '/support' && unreadSupportCount > 0 && !isMobile && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadSupportCount}</Badge>
              )}
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
