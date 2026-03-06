
'use client';
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User, Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Search, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '../../data-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDistanceToNow } from 'date-fns';
import { useUserStatus } from '@/firebase';
import { useAuth } from '@/firebase/provider';

type SupportChatListProps = {
    contacts: User[];
    selectedContact: User | null;
    onSelectContact: (contact: User) => void;
    chats: Chat[];
};

type Filter = 'all' | 'client' | 'team';

const getMessageDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return null;
};

const ChatListItem = ({ contact, isSelected, onSelect, chats, currentUser }: { contact: User, isSelected: boolean, onSelect: (user: User) => void, chats: Chat[], currentUser: User | null }) => {
    const userStatus = useUserStatus(contact.id);
    const chat = chats.find(c => c.clientId === contact.id && c.type === 'support');
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
            onClick={() => onSelect(contact)}
        >
            <div className="relative shrink-0">
                <Avatar className="h-11 w-11">
                    <AvatarImage src={contact.photoURL || PlaceHolderImages.find(p => p.id === contact.avatar)?.imageUrl} alt={contact.name} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                 <div 
                    className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#13131F]",
                        userStatus?.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    )} 
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate text-white text-sm flex-1 min-w-0">
                      {contact.name}
                    </p>
                    {lastMessageDate && (
                      <p className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(lastMessageDate, { addSuffix: true })}
                      </p>
                    )}
                </div>
                <div className="flex justify-between items-center gap-2">
                    <p className="text-sm text-gray-400 truncate flex-1 min-w-0">
                        {lastMessage ? (
                          <>
                           {isSentByMe ? "You: " : `${lastMessage.senderName}: `}
                           {lastMessage.text}
                          </>
                        ) : 'Support thread started'}
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

export function SupportChatList({ contacts, selectedContact, onSelectContact, chats }: SupportChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuth();
  
  const totalUnread = useMemo(() => {
    return chats.filter(c => c.type === 'support').reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }, [chats]);

  const filteredContacts = useMemo(() => contacts
    .filter(contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
        const chatA = chats.find(c => c.clientId === a.id);
        const chatB = chats.find(c => c.clientId === b.id);
        const aTime = chatA?.lastMessageAt?.toDate() || new Date(0);
        const bTime = chatB?.lastMessageAt?.toDate() || new Date(0);
        return bTime.getTime() - aTime.getTime();
    }), [contacts, chats, searchQuery]);

  return (
    <div className="w-full md:w-[340px] h-full flex flex-col bg-[#13131F] text-white">
      <div className="p-4 pt-6 space-y-4">
        <div>
            <h2 className="text-2xl font-bold">Support Inbox</h2>
            {totalUnread > 0 && <p className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500 font-semibold">{totalUnread} active inquiries</p>}
        </div>
        <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
            <Input 
                placeholder="Filter by client..." 
                className="pl-11 w-full rounded-full bg-black/20 border-primary/20 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>
      <div className="w-full h-[1px] bg-gradient-to-r from-primary to-pink-500" />
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="py-2">
            {filteredContacts.map((contact) => (
                <ChatListItem 
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContact?.id === contact.id}
                    onSelect={onSelectContact}
                    chats={chats}
                    currentUser={currentUser}
                />
            ))}
            {filteredContacts.length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-10">No support threads found.</p>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
