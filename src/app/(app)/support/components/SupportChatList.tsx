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
import { UserPresence } from '@/components/ui/user-presence';
import { useAuth } from '@/firebase/provider';

type SupportChatListProps = {
  contacts: User[];
  selectedContact: User | null;
  onSelectContact: (user: User) => void;
};

type Filter = 'all' | 'client' | 'team';

export function SupportChatList({ contacts, selectedContact, onSelectContact }: SupportChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { chats } = useData();
  const { user: currentUser } = useAuth();


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
    <div className="w-full md:w-80 lg:w-96 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Support Chats</h2>
        <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name..." 
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
         <div className="flex items-center gap-2 mt-4">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'client' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('client')}><Briefcase className="mr-2 h-4 w-4" />Clients</Button>
            <Button variant={filter === 'team' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('team')}><Users className="mr-2 h-4 w-4" />Team</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredContacts.map((contact) => {
          const avatar = PlaceHolderImages.find(p => p.id === contact.avatar);
          const lastMessage = contact.chat?.lastMessage;
          const lastMessageDate = contact.chat?.lastMessageAt?.toDate();
          const isSentByMe = lastMessage?.senderId === currentUser?.id;
          const partnerHasRead = lastMessage?.readBy?.includes(contact.id);

          return (
            <div
              key={contact.id}
              className={cn(
                'flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50',
                selectedContact?.id === contact.id && 'bg-muted'
              )}
              onClick={() => onSelectContact(contact)}
            >
              <div className="relative">
                <Avatar>
                    <AvatarImage src={avatar?.imageUrl} alt={contact.name} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <UserPresence userId={contact.id} showLastSeen={false} className="absolute bottom-0 right-0" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{contact.name}</p>
                    {lastMessageDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {isSentByMe && lastMessage && (
                            <span className="inline-block">
                                {partnerHasRead ? (
                                    <svg width="16" height="10" viewBox="0 0 16 10" className="text-blue-500" fill="currentColor"><path d="M1 5l3 3L10 1M6 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 5-7"/></svg>
                                )}
                            </span>
                        )}
                        <span>{formatDistanceToNow(lastMessageDate, { addSuffix: true })}</span>
                    </p>
                    )}
                </div>
                <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground truncate">
                        {lastMessage ? `${lastMessage.senderId === currentUser?.id ? "You: " : ""}${lastMessage.text}` : `Start a conversation...`}
                    </p>
                    {(contact.chat?.unreadCount ?? 0) > 0 ? (
                        <Badge variant="destructive" className="h-5 w-5 justify-center p-0">{contact.chat?.unreadCount}</Badge>
                    ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
