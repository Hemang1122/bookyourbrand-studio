
'use client';

import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { SupportChatRoom } from './components/support-chat-room';
import { Card } from '@/components/ui/card';

export default function SupportPage() {
    const { user } = useAuth();
    const { users } = useData();

    if (!user) {
        return null; // Or a loading state
    }

    // For clients, they chat directly with an admin.
    // For admins, we need a list of clients to chat with. This will be implemented next.
    // For now, let's find the first admin to act as the support agent.
    const supportAgent = users.find(u => u.role === 'admin');
    
    // The client will chat with the admin, the admin will chat with the client
    const chatPartnerId = user.role === 'client' 
        ? supportAgent?.id 
        : users.find(u => u.role === 'client')?.id; // Admin chats with the first client for demo


    if (!chatPartnerId) {
        return (
            <div className="flex h-full flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">No one is available to chat with.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh_-_100px)]">
            <Card className="h-full">
                <SupportChatRoom chatPartnerId={chatPartnerId} />
            </Card>
        </div>
    );
}
