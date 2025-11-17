'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Reply, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { useCollection, useFirebaseServices, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';


function useProjectMessages(projectId: string) {
  const { firestore } = useFirebaseServices();
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

type ChatRoomProps = {
  projectId: string;
};

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { addMessage } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const { data: serverMessages, isLoading: messagesLoading } = useProjectMessages(projectId);
  
  const projectMessages = useMemo(() => {
    return serverMessages || [];
  }, [serverMessages]);


  const getScrollableViewport = useCallback(() => {
    if (scrollAreaRef.current) {
        return scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    }
    return null;
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
        const viewport = getScrollableViewport();
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, 100);
  };

  const handleScrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    const viewport = getScrollableViewport();
    if (messageElement && viewport) {
        const viewportRect = viewport.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        const scrollTop = viewport.scrollTop;
        
        const offset = messageRect.top - viewportRect.top + scrollTop - (viewportRect.height / 2) + (messageRect.height / 2);

        viewport.scrollTo({
            top: offset,
            behavior: 'smooth'
        });

        // Highlight the message briefly
        messageElement.classList.add('bg-accent/50', 'transition-all', 'duration-1000');
        setTimeout(() => {
            messageElement.classList.remove('bg-accent/50', 'transition-all', 'duration-1000');
        }, 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages, getScrollableViewport]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    let messagePayload: Omit<ChatMessage, 'id' | 'timestamp'> = {
        projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar || '',
        message: newMessage,
        fileUrl: null,
        messageType: 'text',
    };

    if (replyTo) {
        messagePayload.replyTo = {
            messageId: replyTo.id,
            message: replyTo.message,
            senderName: replyTo.senderName,
        };
    }

    addMessage(messagePayload);
    setNewMessage('');
    setReplyTo(null);
  };
  
  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {projectMessages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = msg.timestamp ? msg.timestamp.toDate() : new Date();

            return (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className={`group flex items-start gap-3 rounded-md p-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {msg.senderName.charAt(0)}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                    <div className={`relative rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                       {msg.replyTo && (
                         <div 
                           className="p-2 mb-2 border-l-2 border-primary-foreground/50 bg-black/10 rounded-md cursor-pointer hover:bg-black/20"
                           onClick={() => handleScrollToMessage(msg.replyTo!.messageId)}
                           >
                            <p className="text-xs font-semibold">{msg.replyTo.senderName}</p>
                            <p className="text-xs opacity-80 truncate">{msg.replyTo.message}</p>
                         </div>
                       )}

                       <p className="text-sm whitespace-pre-wrap">{msg.message}</p>

                         {!isCurrentUser && (
                            <Button size="icon" variant="ghost" className="absolute -right-10 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setReplyTo(msg)}>
                                <Reply className="h-4 w-4" />
                            </Button>
                         )}
                    </div>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-muted-foreground/80`}>
                        {msg.timestamp ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </p>
                </div>
                {isCurrentUser && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {msg.senderName.charAt(0)}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4 space-y-2">
        {replyTo && (
            <div className="flex items-center justify-between rounded-md bg-muted p-2">
                <div className="text-sm">
                    <p className="font-semibold">Replying to {replyTo.senderName}</p>
                    <p className="text-muted-foreground truncate">{replyTo.message}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
            </Button>
        </form>
      </div>
    </div>
  );
}
