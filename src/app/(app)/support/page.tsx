
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import type { User } from '@/lib/types';
import { SupportChatList } from './components/SupportChatList';
import { SupportChatRoom } from './components/SupportChatRoom';
import { MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const { user: currentUser } = useAuth();
  const { users } = useData();
  const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);

  const potentialChatPartners = useMemo(() => {
    if (!currentUser || !users) return [];
    // Admins can chat with anyone but themselves.
    if (currentUser.role === 'admin') {
      return users.filter(u => u.id !== currentUser.id);
    }
    // Clients and Team members can only chat with admins.
    return users.filter(u => u.role === 'admin');
  }, [currentUser, users]);

  // For clients/team members, auto-select the first admin as the chat partner.
  useEffect(() => {
    if (currentUser && (currentUser.role === 'client' || currentUser.role === 'team')) {
      if (potentialChatPartners.length > 0 && !selectedChatPartner) {
        setSelectedChatPartner(potentialChatPartners[0]);
      }
    }
  }, [currentUser, potentialChatPartners, selectedChatPartner]);


  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full flex">
          {isAdmin ? (
            <>
              <SupportChatList
                contacts={potentialChatPartners}
                selectedContact={selectedChatPartner}
                onSelectContact={setSelectedChatPartner}
              />
              <div className="flex-1 border-l">
                {selectedChatPartner ? (
                    <SupportChatRoom chatPartner={selectedChatPartner} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4" />
                        <h2 className="text-xl font-medium">Select a chat to start messaging</h2>
                    </div>
                )}
              </div>
            </>
          ) : (
             <div className="w-full">
                {selectedChatPartner ? (
                    <SupportChatRoom chatPartner={selectedChatPartner} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4" />
                        <h2 className="text-xl font-medium">Loading chat...</h2>
                    </div>
                )}
             </div>
          )}
        </Card>
    </div>
  );
}
