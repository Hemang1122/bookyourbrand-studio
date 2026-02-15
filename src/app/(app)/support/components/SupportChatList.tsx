'use client';
import { useState } from 'react';
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
  onSelectContact: (user: User) => void;
};

type Filter = 'all' | 'client' | 'team';

const ChatListItem = ({ contact, isSelected, onSelect, chats, currentUser }: { contact: User, isSelected: boolean, onSelect: (user: User) => void, chats: Chat[], currentUser: User | null }) => {
    const userStatus = useUserStatus(contact.id);
    const chat = chats.find(c => c.participants.includes(contact.id));
    const lastMessage = chat?.lastMessage;
    const lastMessageDate = chat?.lastMessageAt?.toDate();
    const isSentByMe = lastMessage?.senderId === currentUser?.id;
    const partnerHasRead = lastMessage?.readBy?.includes(contact.id);
    
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
                        userStatus?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    )} 
                    style={{
                        boxShadow: userStatus?.isOnline ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'
                    }}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-semibold truncate text-white text-sm">{contact.name}</p>
                    {lastMessageDate && (
                      <p className="text-xs text-gray-400 shrink-0 ml-2">{formatDistanceToNow(lastMessageDate, { addSuffix: true })}</p>
                    )}
                </div>
                <div className="flex justify-between items-start mt-1">
                    <p className="text-sm text-gray-400 truncate pr-2">
                        {lastMessage ? (
                          <>
                           {isSentByMe && (
                              <span className="inline-flex items-center mr-1">
                                {partnerHasRead ? (
                                    <svg width="16" height="10" viewBox="0 0 16 10" className="text-blue-400" fill="currentColor"><path d="M1 5l3 3L10 1M6 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 5-7"/></svg>
                                )}
                              </span>
                            )}
                            {lastMessage.text}
                          </>
                        ) : 'Start a conversation...'}
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


export function SupportChatList({ contacts, selectedContact, onSelectContact }: SupportChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { chats, notifications } = useData();
  const { user: currentUser } = useAuth();
  
  const totalUnread = useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }, [chats]);

  const filteredContacts = contacts
    .map(contact => ({
      ...contact,
      chat: chats.find(c => c.participants.includes(contact.id)),
    }))
    .filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        return contact.role === filter;
    })
    .sort((a, b) => {
        const aTime = a.chat?.lastMessageAt?.toDate() || new Date(0);
        const bTime = b.chat?.lastMessageAt?.toDate() || new Date(0);
        return bTime.getTime() - aTime.getTime();
    });

  return (
    <div className="w-full md:w-[340px] h-full flex flex-col bg-[#13131F] text-white">
      <div className="p-4 pt-6 space-y-4">
        <div>
            <h2 className="text-2xl font-bold">Messages</h2>
            {totalUnread > 0 && <p className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500 font-semibold">{totalUnread} unread messages</p>}
        </div>
        <div className="relative">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" 
            />
            <Input 
                placeholder="Search conversations..." 
                className="pl-11 w-full rounded-full bg-black/20 border-primary/20 focus:ring-primary/50 focus:border-primary/50 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
         <div className="flex items-center gap-2">
            <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')} className={cn("rounded-full", filter === 'all' && 'bg-primary/20 text-primary')}>All</Button>
            <Button variant={filter === 'client' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('client')} className={cn("rounded-full", filter === 'client' && 'bg-primary/20 text-primary')}><Briefcase className="mr-2 h-4 w-4" />Clients</Button>
            <Button variant={filter === 'team' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('team')} className={cn("rounded-full", filter === 'team' && 'bg-primary/20 text-primary')}><Users className="mr-2 h-4 w-4" />Team</Button>
        </div>
      </div>
      <div className="w-full h-[1px] bg-gradient-to-r from-primary to-pink-500" />
      <ScrollArea className="flex-1">
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
        </div>
      </ScrollArea>
    </div>
  );
}
