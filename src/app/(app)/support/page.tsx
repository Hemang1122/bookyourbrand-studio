'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { SupportChatRoom } from './components/support-chat-room';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SupportPage() {
    const { user: currentUser } = useAuth();
    const { users } = useData();
    const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'client', 'team'

    if (!currentUser) {
        return null; // Or a loading state
    }

    const availablePartners = useMemo(() => {
        if (currentUser.role === 'admin') {
            return users.filter(u => u.id !== currentUser.id);
        }
        if (currentUser.role === 'client') {
            return users.filter(u => u.role === 'admin');
        }
        return []; // Team members don't use this page
    }, [users, currentUser]);


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

    // Correctly handle auto-selection in useEffect
    useState(() => {
        if (currentUser?.role === 'client' && availablePartners.length > 0 && !selectedChatPartner) {
            setSelectedChatPartner(availablePartners[0]);
        }
    });
    
    if (currentUser.role === 'team') {
        return <div className="text-center p-8">Support chat is available for admins and clients.</div>
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
                            {filteredPartners.map(partner => (
                                <Button
                                    key={partner.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start h-auto p-3 text-left",
                                        selectedChatPartner?.id === partner.id && "bg-accent"
                                    )}
                                    onClick={() => setSelectedChatPartner(partner)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold">{partner.name}</p>
                                        <Badge variant="outline" className="capitalize">{partner.role}</Badge>
                                    </div>
                                </Button>
                            ))}
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
