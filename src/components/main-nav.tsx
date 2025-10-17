'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  FileText,
  Settings,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'team', 'client'] },
  { href: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'team', 'client'] },
  { href: '/clients', icon: Users, label: 'Clients', roles: ['admin'] },
  // Standalone chat and files pages can be added here if needed
  // { href: '/chats', icon: MessageSquare, label: 'Chats', roles: ['admin', 'team', 'client'] },
  // { href: '/files', icon: FileText, label: 'Files', roles: ['admin', 'team', 'client'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'team', 'client'] },
];

export function MainNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="flex flex-col">
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
