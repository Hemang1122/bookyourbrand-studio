'use client';
import { useData } from '../../data-provider';

export default function TypingIndicator({ typingUserIds }: { typingUserIds: string[] }) {
  const { users } = useData();
  
  if (!typingUserIds || typingUserIds.length === 0) return null;
  
  const typingUsers = users.filter(u => typingUserIds.includes(u.id));
  
  if (typingUsers.length === 0) return null;
  
  const names = typingUsers.map(u => u.name).join(', ');
  
  return (
    <div className="px-4 py-2 border-t border-white/5 bg-[#13131F]/50">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="flex gap-1">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{names} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
      </div>
    </div>
  );
}
