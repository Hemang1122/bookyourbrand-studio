
'use client';

import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useData } from './data-provider';
import { useAuth } from '@/firebase/provider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, compareDesc } from 'date-fns';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, markNotificationsAsRead, isLoading } = useData();

  // Memoize notifications to prevent re-renders, handle null safety
  const safeNotifications = useMemo(() => Array.isArray(notifications) ? notifications : [], [notifications]);

  // Sort notifications once
  const sortedNotifications = useMemo(() => {
    return safeNotifications.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return compareDesc(dateA, dateB);
    });
  }, [safeNotifications]);


  const unreadCount = useMemo(() => {
    return sortedNotifications.filter(n => !n.read).length;
  }, [sortedNotifications]);


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
          {!isLoading && unreadCount > 0 && (
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
            <Button variant="link" size="sm" onClick={markNotificationsAsRead} className="p-0 h-auto">
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
             <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
             </div>
          ) : sortedNotifications.length > 0 ? (
            <div className="divide-y">
              {sortedNotifications.map(notif => {
                const timestampDate = notif.timestamp?.toDate ? notif.timestamp.toDate() : new Date(notif.timestamp || 0);
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
      </PopoverContent>
    </Popover>
  );
}
