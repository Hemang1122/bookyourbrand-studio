import type { Notification } from '@/lib/types';
import { compareDesc } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';

type RecentActivityProps = {
    notifications: Notification[];
}

export function RecentActivity({ notifications }: RecentActivityProps) {

  const recentNotifications = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    return notifications
      .sort((a, b) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return compareDesc(dateA, dateB);
      })
      .slice(0, 5);
  }, [notifications]);

  if (!notifications) {
    return (
        <div className="text-center text-muted-foreground p-4">
            Loading activities...
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentNotifications.length > 0 ? (
        recentNotifications.map((notif) => {
            const timestampDate = notif.timestamp?.toDate ? notif.timestamp.toDate() : new Date(notif.timestamp);
            return (
                <div key={notif.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                        {notif.message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(timestampDate, { addSuffix: true })}
                    </p>
                    </div>
                </div>
            )
        })
      ) : (
        <div className="text-center text-muted-foreground p-4">
            No recent activity.
        </div>
      )}
    </div>
  );
}
