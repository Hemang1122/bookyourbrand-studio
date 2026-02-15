'use client';

import { useUserStatus } from '@/firebase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type UserPresenceProps = {
  userId: string;
  showLastSeen?: boolean;
  className?: string;
};

export function UserPresence({ userId, showLastSeen = true, className }: UserPresenceProps) {
  const userStatus = useUserStatus(userId);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          userStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <div className="text-xs text-muted-foreground">
        {userStatus?.isOnline ? (
          'Online'
        ) : showLastSeen && userStatus?.last_seen ? (
          `Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), {
            addSuffix: true,
          })}`
        ) : (
          'Offline'
        )}
      </div>
    </div>
  );
}
