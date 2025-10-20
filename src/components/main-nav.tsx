
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
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/types';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'team', 'client'] },
  { href: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'team', 'client'] },
  { href: '/clients', icon: Briefcase, label: 'Clients', roles: ['admin'] },
  { href: '/team', icon: Users, label: 'Team', roles: ['admin'] },
  { href: '/scrum', icon: GitCommit, label: 'Scrum', roles: ['admin', 'team'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'team', 'client'] },
];

export function MainNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));
  const { isMobile } = useSidebar();

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
                <item.icon className="h-5 w-5" />
                 {isMobile && <span>{item.label}</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
