
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

function useProjectMessages(projectId: string) {
  const firestore = useFirestore();
  const { user } = useAuth();

  const q = useMemoFirebase(() => {
    if (!firestore || !user || !projectId) return null;
    return query(
      collection(firestore, 'messages'),
      where('projectId', '==', projectId),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, user, projectId]);

  return useCollection<ChatMessage>(q);
}


export function ChatRoom({ projectId }: { projectId: string }) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { users, addMessage } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { data: serverMessages, isLoading } = useProjectMessages(projectId);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);


  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }
    }, 100);
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [serverMessages]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim()) return;

    const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        projectId: projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        message: newMessage,
        timestamp: Timestamp.now(),
    };
    
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    addMessage(projectId, newMessage);
    setNewMessage('');
    scrollToBottom();
  };

  const projectMessages = useMemo(() => {
    const combined = [...(serverMessages || []), ...optimisticMessages];
    const uniqueMessages = Array.from(new Map(combined.map(m => [`${m.senderId}-${m.timestamp?.seconds}-${m.message}`, m])).values());
    
    return uniqueMessages.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
    });
  }, [serverMessages, optimisticMessages]);


  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoading && projectMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">Loading messages...</div>
          )}
          {!isLoading && projectMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Send a message to start the conversation!
            </div>
          )}
          {projectMessages.map((msg, index) => {
            const sender = users.find(u => u.id === msg.senderId);
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = msg.timestamp?.toDate() || new Date();
            const isOptimistic = msg.id.startsWith('optimistic-');
            
            const prevMessage = index > 0 ? projectMessages[index-1] : null;
            const showSender = !prevMessage || prevMessage.senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-60' : ''}`}
              >
                {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {showSender && sender?.name.charAt(0)}
                    </div>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {showSender && !isCurrentUser && <span className="text-xs text-muted-foreground">{sender?.name}</span>}
                    <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-muted-foreground/80`}>
                        {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isLoading}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
