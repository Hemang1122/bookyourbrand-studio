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
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {userStatus?.isOnline ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-400">Online</span>
          </div>
        ) : showLastSeen && userStatus?.last_seen ? (
          <span className="text-gray-400">{`Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}`}</span>
        ) : (
          <span className="text-gray-500">Offline</span>
        )}
    </div>
  );
}
