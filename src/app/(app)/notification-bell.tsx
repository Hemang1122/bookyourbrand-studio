
'use client';

import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useData } from './data-provider';
import { useAuth } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, compareDesc } from 'date-fns';
import { useMemo } from 'react';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, projects, markNotificationsAsRead } = useData();

  const userProjectIds = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
      // Admins see all notifications
      return projects.map(p => p.id).concat(['general']);
    }
    if (user.role === 'client') {
      const clientProjects = projects.filter(p => p.client.id === user.id).map(p => p.id);
      return [...clientProjects, 'general'];
    }
    if (user.role === 'team') {
       const teamProjects = projects.filter(p => p.team.some(tm => tm.id === user.id)).map(p => p.id);
       return [...teamProjects, 'general'];
    }
    return ['general'];
  }, [user, projects]);

  const relevantNotifications = useMemo(() => {
    return notifications
      .filter(n => userProjectIds.includes(n.projectId))
      .sort((a, b) => {
        const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return compareDesc(dateA, dateB);
      });
  }, [notifications, userProjectIds]);

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    if (!open && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={() => markNotificationsAsRead()} className="p-0 h-auto">
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {relevantNotifications.length > 0 ? (
            <div className="divide-y">
              {relevantNotifications.map(notif => {
                const timestampDate = notif.timestamp.toDate ? notif.timestamp.toDate() : new Date(notif.timestamp);
                return (
                    <div key={notif.id} className={`p-4 ${!notif.read ? 'bg-accent/50' : ''} hover:bg-muted/50`}>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(timestampDate, { addSuffix: true })}
                    </p>
                    </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You have no new notifications.
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" disabled>
                <Check className="mr-2 h-4 w-4" /> Clear All
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
