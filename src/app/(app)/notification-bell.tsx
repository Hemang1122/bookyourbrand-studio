'use client';

import { Bell, Check, PhoneMissed } from 'lucide-react';
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
import { useState, useMemo, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { sounds } from '@/lib/sounds';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, markNotificationsAsRead, isLoading } = useData();
  const prevUnreadCountRef = useRef<number>();

  // Memoize notifications to prevent re-renders, handle null safety
  const allNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    return notifications;
  }, [notifications]);

  // Sort notifications once
  const sortedNotifications = useMemo(() => {
    return allNotifications.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return compareDesc(dateA, dateB);
    });
  }, [allNotifications]);


  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return sortedNotifications.filter(n => !(n.readBy || []).includes(user.id)).length;
  }, [sortedNotifications, user]);

  useEffect(() => {
    // On the first run, the ref is undefined. We'll set it and skip playing a sound.
    if (prevUnreadCountRef.current === undefined) {
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    // If the new unread count is greater than the previous one, it means a new notification has arrived.
    if (unreadCount > prevUnreadCountRef.current) {
      sounds.notification();
    }

    // Update the ref to the current count for the next check.
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);


  const handleOpenChange = (open: boolean) => {
    // When the popover is closed, mark notifications as read.
    if (!open && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };


  if (!user) return null;

  return (
    <>
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {!isLoading && unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
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
                  const isUnread = !(notif.readBy || []).includes(user.id);
                  
                  if (notif.type === 'missed_call') {
                    return (
                      <Link href={notif.url || '#'} key={notif.id} className="block">
                        <div className={`flex items-center gap-3 p-4 ${isUnread ? 'bg-red-500/10' : ''} hover:bg-muted/50 border-l-2 ${isUnread ? 'border-red-500' : 'border-transparent'}`}>
                          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <PhoneMissed className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-400">
                              Missed call from {(notif as any).senderName || 'Someone'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(timestampDate, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link href={notif.url || '#'} key={notif.id} className="block">
                      <div className={`p-4 ${isUnread ? 'bg-accent/50' : ''} hover:bg-muted/50`}>
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(timestampDate, { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
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
    </>
  );
}
