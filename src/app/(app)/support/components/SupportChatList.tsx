'use client';
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Search, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDistanceToNow } from 'date-fns';
import { useUserStatus } from '@/firebase';
import { useAuth } from '@/firebase/provider';

type Filter = 'all' | 'client' | 'team';

type SupportChatListProps = {
  users: User[];
  selectedUserId?: string;
  onSelectChat: (user: User, chatId?: string) => void;
  chats: Chat[];
};

const getMessageDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return null;
};

const ChatListItem = ({
  user,
  chat,
  isSelected,
  onSelect,
  currentUser,
}: {
  user: User;
  chat?: Chat;
  isSelected: boolean;
  onSelect: () => void;
  currentUser: User | null;
}) => {
  const userStatus = useUserStatus(user.id);
  const lastMessage = chat?.lastMessage;
  const lastMessageDate = getMessageDate(chat?.lastMessageAt);
  const isSentByMe = lastMessage?.senderId === currentUser?.id;
  const unreadCount = chat?.unreadCount || 0;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 cursor-pointer transition-colors duration-200 border-l-4',
        isSelected ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-primary/5'
      )}
      onClick={onSelect}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage
            src={user.photoURL || PlaceHolderImages.find(p => p.id === user.avatar)?.imageUrl}
            alt={user.name}
          />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#13131F]',
            userStatus?.isOnline ? 'bg-green-500' : 'bg-gray-500'
          )}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold truncate text-white text-sm flex-1 min-w-0">{user.name}</p>
          {lastMessageDate && (
            <p className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
              {formatDistanceToNow(lastMessageDate, { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm text-gray-400 truncate flex-1 min-w-0">
            {lastMessage ? (
              <>{isSentByMe ? 'You: ' : `${lastMessage.senderName}: `}{lastMessage.text}</>
            ) : (
              <span className="italic text-gray-500">Start a conversation...</span>
            )}
          </p>
          {unreadCount > 0 && (
            <div className="h-5 w-5 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-pink-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function SupportChatList({ users, selectedUserId, onSelectChat, chats }: SupportChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { user: currentUser } = useAuth();

  const totalUnread = useMemo(() =>
    chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    [chats]
  );

  // Build a list of user+chat pairs based on active filter
  const chatItems = useMemo(() => {
    // Start with ALL users (except current admin)
    const relevantUsers = users.filter(u => u.id !== currentUser?.id);

    const items = relevantUsers.map(user => {
      // Find existing chat for this user
      let chat: Chat | undefined;
      if (user.role === 'client') {
        chat = chats.find(c => c.type === 'support' && (c as any).clientId === user.id);
      } else {
        // team/admin - find direct chat
        chat = chats.find(c => 
          c.type === 'direct' && 
          c.participants?.includes(user.id) && 
          c.participants?.includes(currentUser?.id || '')
        );
      }
      return { user, chat };
    });

    // Apply role filter
    const filtered = items.filter(({ user }) => {
      if (filter === 'client') return user.role === 'client';
      if (filter === 'team') return user.role === 'team' || user.role === 'admin';
      return true; // 'all'
    });

    // Apply search
    const searched = filtered.filter(({ user }) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: users WITH chats first (by lastMessageAt), then users without chats alphabetically
    return searched.sort((a, b) => {
      // Both have chats with messages
      if (a.chat?.lastMessage && b.chat?.lastMessage) {
        const aTime = getMessageDate(a.chat.lastMessageAt)?.getTime() || 0;
        const bTime = getMessageDate(b.chat.lastMessageAt)?.getTime() || 0;
        return bTime - aTime;
      }
      // Only a has messages
      if (a.chat?.lastMessage && !b.chat?.lastMessage) return -1;
      // Only b has messages  
      if (!a.chat?.lastMessage && b.chat?.lastMessage) return 1;
      // Both have chats but no messages yet - sort by chat creation time
      if (a.chat && b.chat) {
        const aTime = getMessageDate(a.chat.lastMessageAt)?.getTime() || 0;
        const bTime = getMessageDate(b.chat.lastMessageAt)?.getTime() || 0;
        return bTime - aTime;
      }
      // One has a chat, other doesn't
      if (a.chat && !b.chat) return -1;
      if (!a.chat && b.chat) return 1;
      // Neither has a chat - alphabetical
      return a.user.name.localeCompare(b.user.name);
    });
  }, [chats, users, filter, searchQuery, currentUser]);

  return (
    <div className="w-full md:w-[340px] h-full flex flex-col bg-[#13131F] text-white">
      <div className="p-4 pt-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          {totalUnread > 0 && (
            <p className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500 font-semibold">
              {totalUnread} unread
            </p>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
          <Input
            placeholder="Search conversations..."
            className="pl-11 w-full rounded-full bg-black/20 border-primary/20 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'client', 'team'] as Filter[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'ghost'}
              className={cn(
                'rounded-full capitalize text-xs h-8 px-4',
                filter === f
                  ? 'bg-gradient-to-r from-primary to-pink-500 text-white border-0'
                  : 'text-gray-400 hover:text-white'
              )}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All'}
              {f === 'client' && <><Briefcase className="h-3 w-3 mr-1" />Clients</>}
              {f === 'team' && <><Users className="h-3 w-3 mr-1" />Team</>}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-primary to-pink-500" />

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="py-2">
          {chatItems.map(({ user, chat }) => (
            <ChatListItem
              key={user.id}
              user={user}
              chat={chat}
              isSelected={selectedUserId === user.id}
              onSelect={() => onSelectChat(user, chat?.id)}
              currentUser={currentUser}
            />
          ))}
          {chatItems.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-10">No conversations found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}