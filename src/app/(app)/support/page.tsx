'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { SupportChatRoom } from './components/support-chat-room';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { User, Notification, Chat } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { useCollection, useFirebaseServices, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function SupportPage() {
    const { user: currentUser } = useAuth();
    const { users, notifications, markChatNotificationsAsRead } = useData();
    const { firestore } = useFirebaseServices();
    const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'client', 'team'
    const searchParams = useSearchParams();

    if (!currentUser) {
        return null; // Or a loading state
    }

    const unreadChatCounts = useMemo(() => {
        const counts = new Map<string, number>();
        if (!notifications) return counts;
        
        notifications
            .filter(n => n.type === 'chat' && !n.readBy.includes(currentUser.id))
            .forEach(n => {
                const chatId = n.chatId;
                if (chatId) {
                    // Other user's ID is the part of the chatId that is not the current user's ID
                    const partnerId = chatId.replace(currentUser.id, '').replace('_', '');
                    counts.set(partnerId, (counts.get(partnerId) || 0) + 1);
                }
            });
        return counts;
    }, [notifications, currentUser.id]);

    const chatsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser) return null;
        return query(collection(firestore, 'chats'), where('participants', 'array-contains', currentUser.id));
    }, [firestore, currentUser]);

    const { data: chatsData } = useCollection<Chat>(chatsQuery);

    const chatLastActivity = useMemo(() => {
        const lastActivity = new Map<string, number>();
        if (!chatsData || !currentUser) return lastActivity;

        chatsData.forEach(chat => {
            const partnerId = chat.id.replace(currentUser.id, '').replace('_', '');
            if (chat.lastActivity) {
                const timestamp = chat.lastActivity.toDate ? chat.lastActivity.toDate().getTime() : 0;
                lastActivity.set(partnerId, timestamp);
            }
        });
        return lastActivity;
    }, [chatsData, currentUser]);


    const availablePartners = useMemo(() => {
        let partners: User[] = [];
        if (currentUser.role === 'admin') {
            partners = users.filter(u => u.id !== currentUser.id);
        } else if (currentUser.role === 'client') {
            partners = users.filter(u => u.role === 'admin');
        }
        
        return partners.sort((a, b) => {
            const aLastActivity = chatLastActivity.get(a.id) || 0;
            const bLastActivity = chatLastActivity.get(b.id) || 0;
            
            if (aLastActivity !== bLastActivity) {
                return bLastActivity - aLastActivity;
            }
            
            return a.name.localeCompare(b.name);
        });

    }, [users, currentUser, chatLastActivity]);


    const filteredPartners = useMemo(() => {
        return availablePartners
            .filter(partner => {
                // Role filter
                if (roleFilter === 'all') return true;
                return partner.role === roleFilter;
            })
            .filter(partner => {
                // Search filter
                return partner.name.toLowerCase().includes(searchQuery.toLowerCase());
            });
    }, [availablePartners, searchQuery, roleFilter]);

    // Effect to auto-select chat partner from URL or default
    useEffect(() => {
        const chatWithId = searchParams.get('chatWith');
        if (chatWithId) {
            const partner = availablePartners.find(p => p.id === chatWithId);
            if (partner) {
                setSelectedChatPartner(partner);
                 const chatId = [currentUser.id, partner.id].sort().join('_');
                markChatNotificationsAsRead(chatId);
            }
        } else if (currentUser.role === 'client' && availablePartners.length > 0 && !selectedChatPartner) {
            setSelectedChatPartner(availablePartners[0]);
        }
    }, [searchParams, availablePartners, currentUser, selectedChatPartner, markChatNotificationsAsRead]);
    
    
    if (currentUser.role === 'team') {
        return <div className="text-center p-8">Support chat is available for admins and clients.</div>
    }

    const handleSelectPartner = (partner: User) => {
        setSelectedChatPartner(partner);
        const chatId = [currentUser.id, partner.id].sort().join('_');
        markChatNotificationsAsRead(chatId);
    }

    return (
        <div className="h-[calc(100vh_-_100px)] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {currentUser.role === 'admin' && (
                        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full pt-2">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="client">Clients</TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                            {filteredPartners.map(partner => {
                                const unreadCount = unreadChatCounts.get(partner.id) || 0;
                                return (
                                <Button
                                    key={partner.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start h-auto p-3 text-left",
                                        selectedChatPartner?.id === partner.id && "bg-accent"
                                    )}
                                    onClick={() => handleSelectPartner(partner)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold">{partner.name}</p>
                                        <Badge variant="outline" className="capitalize">{partner.role}</Badge>
                                    </div>
                                    {unreadCount > 0 && (
                                        <Badge className="bg-primary hover:bg-primary">{unreadCount}</Badge>
                                    )}
                                </Button>
                            )})}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <Card className="h-full">
                {selectedChatPartner ? (
                    <SupportChatRoom key={selectedChatPartner.id} chatPartner={selectedChatPartner} />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Select a contact to start chatting</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
