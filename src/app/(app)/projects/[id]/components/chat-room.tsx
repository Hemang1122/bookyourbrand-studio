
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-client';
import { useFirestore, useCollection } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import Link from 'next/link';
import { useData } from '../../../data-provider';

type ChatRoomProps = {
  projectId: string;
};

// For simplicity, we'll use a fixed chat ID per project.
const CHAT_ID = 'main-chat';

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { triggerNotification } = useData();
  const prevMessagesCount = useRef(0);

  const messagesRef = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'projects', projectId, 'chats', CHAT_ID, 'messages');
  }, [firestore, projectId]);

  const messagesQuery = useMemo(() => {
    if (!messagesRef) return null;
    return query(messagesRef, orderBy('timestamp', 'asc'));
  }, [messagesRef]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
    if (messages && messages.length > prevMessagesCount.current) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.senderId !== currentUser?.id) {
            triggerNotification();
        }
    }
    prevMessagesCount.current = messages ? messages.length : 0;
  }, [messages, currentUser, triggerNotification]);


  const sendMessage = (message: string, fileUrl?: string) => {
     if (!currentUser || !messagesRef) return;
     
     const messagePayload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message: message,
      timestamp: serverTimestamp(),
      fileUrl: fileUrl || null,
    };
    
    addDocumentNonBlocking(messagesRef, messagePayload);
  }


  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    sendMessage(newMessage);
    setNewMessage('');
  };

  const handleAddAttachment = (url: string, message: string) => {
    sendMessage(message || url, url);
  }
  
  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading && <p>Loading messages...</p>}
          {messages && messages.map((msg) => {
            const userAvatar = PlaceHolderImages.find(img => img.id === msg.senderAvatar);
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = (msg.timestamp as any)?.toDate ? (msg.timestamp as any).toDate() : new Date();

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={msg.senderName} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                    <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.fileUrl ? (
                           <div className="space-y-2">
                             <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 hover:bg-accent">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">File Attachment</p>
                                    <p className="text-xs text-muted-foreground truncate">{msg.fileUrl}</p>
                                </div>
                                <LinkIcon className="h-4 w-4 text-muted-foreground"/>
                             </a>
                             {msg.message && msg.message !== msg.fileUrl && <p className="text-sm">{msg.message}</p>}
                           </div>
                        ) : (
                            <p className="text-sm">{msg.message}</p>
                        )}
                    </div>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-muted-foreground/80`}>
                        {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                 {isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={msg.senderName} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
          <AddChatAttachmentDialog onAddAttachment={handleAddAttachment}>
            <Button variant="ghost" size="icon" type="button">
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach file</span>
            </Button>
          </AddChatAttachmentDialog>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={!messagesRef}
          />
          <Button type="submit" size="icon" disabled={!messagesRef || !newMessage}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
