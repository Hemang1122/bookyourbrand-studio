
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

type RecentActivityProps = {
  notifications: Notification[] | null | undefined;
  isLoading: boolean;
};

export function RecentActivity({ notifications, isLoading: isDataLoading }: RecentActivityProps) {
  
  const isLoading = isDataLoading || !notifications;

  const recentNotifications = useMemo(() => {
    // Use optional chaining `?.` which returns undefined if notifications is null/undefined.
    const sorted = notifications?.sort((a, b) => {
        const dateA = a?.timestamp?.toDate ? a.timestamp.toDate() : new Date(a?.timestamp || 0);
        const dateB = b?.timestamp?.toDate ? b.timestamp.toDate() : new Date(b?.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });

    // If sorted is undefined, return an empty array, otherwise slice it.
    return sorted ? sorted.slice(0, 5) : [];
  }, [notifications]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center text-center text-muted-foreground p-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading activities...
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentNotifications.length > 0 ? (
        recentNotifications.map((notif) => {
          const timestampDate = notif.timestamp?.toDate
            ? notif.timestamp.toDate()
            : new Date(notif.timestamp);
          return (
            <div key={notif.id} className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{notif.message}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(timestampDate, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-muted-foreground p-4">No recent activity.</div>
      )}
    </div>
  );
}
