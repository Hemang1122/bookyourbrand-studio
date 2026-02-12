'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { SupportChatRoom } from './components/support-chat-room';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SupportPage() {
    const { user: currentUser } = useAuth();
    const { users } = useData();
    const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);

    if (!currentUser) {
        return null; // Or a loading state
    }

    // Admins can chat with anyone but themselves.
    // Clients can only chat with admins.
    const chatPartners = currentUser.role === 'admin' 
        ? users.filter(u => u.id !== currentUser.id)
        : users.filter(u => u.role === 'admin');

    // Correctly handle auto-selection in useEffect
    useEffect(() => {
        if (currentUser?.role === 'client' && chatPartners.length === 1 && !selectedChatPartner) {
            setSelectedChatPartner(chatPartners[0]);
        }
    }, [currentUser, chatPartners, selectedChatPartner]);
    
    // For team members, this page isn't available, but as a fallback:
    if (currentUser.role === 'team') {
        return <div className="text-center p-8">Support chat is available for admins and clients.</div>
    }

    return (
        <div className="h-[calc(100vh_-_100px)] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                            {chatPartners.map(partner => (
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
