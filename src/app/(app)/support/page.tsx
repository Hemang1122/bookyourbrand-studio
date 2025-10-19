'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportChatRoom } from './components/support-chat-room';
import { useAuth } from '@/lib/auth-client';
import { useData } from '../data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SupportPage() {
    const { user } = useAuth();
    const { clients, users } = useData();
    const admin = users.find(u => u.role === 'admin');

    // For admin, the state holds the ID of the client they are currently chatting with
    const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);

    if (!user) return null;

    // Admin View: A list of clients on the left, chat on the right
    if (user.role === 'admin') {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Client Support Center</h2>
                    <p className="text-muted-foreground">
                        Select a client to view and respond to direct messages.
                    </p>
                </div>
                <Card className="h-[75vh]">
                    <div className="grid h-full grid-cols-1 md:grid-cols-[300px_1fr]">
                        <div className="border-r">
                            <CardHeader>
                                <CardTitle>Clients</CardTitle>
                            </CardHeader>
                             <ScrollArea className="h-[calc(75vh-80px)]">
                                <div className="space-y-1 p-2">
                                    {clients.map(client => {
                                        const avatar = PlaceHolderImages.find(img => img.id === client.avatar);
                                        return (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClientId(client.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 text-left p-2 rounded-md transition-colors",
                                                    selectedClientId === client.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                                )}
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={avatar?.imageUrl} alt={client.name} data-ai-hint={avatar?.imageHint} />
                                                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{client.name}</p>
                                                    <p className="text-xs text-muted-foreground">{client.company}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                             </ScrollArea>
                        </div>
                        <div className="flex flex-col">
                            {selectedClientId ? (
                                <SupportChatRoom key={selectedClientId} chatPartnerId={selectedClientId} />
                            ) : (
                                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                                    <p>Select a client to start chatting.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Client View: Direct chat with the admin
    if (!admin) return <div>Admin user not found. Please contact support.</div>;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Support Chat</h2>
                <p className="text-muted-foreground">
                    Have a question or need assistance? Send a message directly to the admin.
                </p>
            </div>
            <Card className="h-[75vh]">
                 <SupportChatRoom chatPartnerId={admin.id} />
            </Card>
        </div>
    );
}
