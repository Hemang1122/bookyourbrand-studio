
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
import { collection, serverTimestamp, query, orderBy, where, or } from 'firebase/firestore';
import { AddChatAttachmentDialog } from '../../projects/[id]/components/add-chat-attachment-dialog';
import { useData } from '../../data-provider';

type SupportChatRoomProps = {
  chatPartnerId: string;
};

export function SupportChatRoom({ chatPartnerId }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { triggerNotification, users } = useData();
  const prevMessagesCount = useRef(0);

  const chatPartner = useMemo(() => users.find(u => u.id === chatPartnerId), [users, chatPartnerId]);

  const messagesRef = useMemo(() => {
    if (!firestore) return null;
    // We'll create a dedicated collection for support chats
    return collection(firestore, 'supportChats');
  }, [firestore]);

  const messagesQuery = useMemo(() => {
    if (!messagesRef || !currentUser) return null;
    // This query fetches messages where the current user is either the sender or receiver,
    // and the other party is the chat partner. This defines a private chat room.
    return query(
        messagesRef,
        or(
            where('senderId', '==', currentUser.id),
            where('receiverId', '==', currentUser.id)
        ),
        orderBy('timestamp', 'asc')
    );
  }, [messagesRef, currentUser]);
  
  const { data: rawMessages, isLoading } = useCollection<ChatMessage>(messagesQuery);

  // Further filter messages client-side to ensure it's only between the two partners
  const messages = useMemo(() => {
    if (!rawMessages) return [];
    return rawMessages.filter(msg => 
        (msg.senderId === currentUser?.id && msg.receiverId === chatPartnerId) || 
        (msg.senderId === chatPartnerId && msg.receiverId === currentUser?.id)
    );
  }, [rawMessages, currentUser, chatPartnerId]);


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
     
     const messagePayload: any = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      receiverId: chatPartnerId,
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
  
  if (!currentUser || !chatPartner) return null;

  return (
    <div className="flex h-[60vh] flex-col rounded-md border">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading && <p>Loading messages...</p>}
          {!isLoading && messages?.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Start the conversation!
            </div>
          )}
          {messages && messages.map((msg, index) => {
            const sender = users.find(u => u.id === msg.senderId);
            const userAvatar = PlaceHolderImages.find(img => img.id === sender?.avatar);
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = (msg.timestamp as any)?.toDate ? (msg.timestamp as any).toDate() : new Date();

            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={sender?.name} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{sender?.name}</span>
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
                        <AvatarImage src={PlaceHolderImages.find(img => img.id === currentUser.avatar)?.imageUrl} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background">
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
            disabled={!firestore}
          />
          <Button type="submit" size="icon" disabled={!firestore || !newMessage}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
