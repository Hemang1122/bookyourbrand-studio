
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportChatRoom } from './components/support-chat-room';
import { useAuth } from '@/lib/auth-client';
import { useData } from '../data-provider';
import { MultiSelect } from '@/components/ui/multi-select';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function SupportPage() {
    const { user } = useAuth();
    const { clients } = useData();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);

    if (!user) return null;

    if (user.role === 'admin') {
        const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));

        return (
            <div className="space-y-6">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Client Support Center</h2>
                    <p className="text-muted-foreground">
                        View and respond to direct messages from clients.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Client Chat</CardTitle>
                        <CardDescription>Select a client to view the conversation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-sm space-y-2">
                            <Label>Select Client</Label>
                            <Select onValueChange={(val) => setSelectedClientId(val)} value={selectedClientId || undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedClientId && <SupportChatRoom chatPartnerId={selectedClientId} />}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Client View
    const admin = useData().users.find(u => u.role === 'admin');
    if (!admin) return <div>Admin user not found.</div>;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Support Chat</h2>
                <p className="text-muted-foreground">
                    Have a question or need assistance? Send a message directly to the admin.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Chat with {admin.name}</CardTitle>
                    <CardDescription>This is a private chat between you and the administrator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SupportChatRoom chatPartnerId={admin.id} />
                </CardContent>
            </Card>
        </div>
    );
}
