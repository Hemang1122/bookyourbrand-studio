
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-client';
import { useFirestore, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { AddChatAttachmentDialog } from '../../projects/[id]/components/add-chat-attachment-dialog';
import { useData } from '../../data-provider';
import { CardHeader, CardTitle } from '@/components/ui/card';

type SupportChatRoomProps = {
  chatPartnerId: string;
};

export function SupportChatRoom({ chatPartnerId }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { triggerNotification, users } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatPartner = useMemo(() => users.find(u => u.id === chatPartnerId), [users, chatPartnerId]);

  const messagesCollectionRef = useMemo(() => {
    if (!firestore || !currentUser) return null;
    // CORRECTED: The path now correctly uses the CURRENT user's ID for the query,
    // ensuring we only ever try to read from a location the user has access to.
    return collection(firestore, 'users', currentUser.id, 'chats', chatPartnerId, 'messages');
  }, [firestore, currentUser, chatPartnerId]);

  const messagesQuery = useMemo(() => {
    if (!messagesCollectionRef) return null;
    return query(messagesCollectionRef, orderBy('timestamp', 'asc'));
  }, [messagesCollectionRef]);
  
  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser?.id) {
          triggerNotification();
      }
    }
  }, [messages, currentUser, triggerNotification]);


  const sendMessage = async (message: string, fileUrl?: string) => {
     if (!currentUser || !firestore || (!message.trim() && !fileUrl)) return;
     
     const messagePayload: Omit<ChatMessage, 'id'> = {
      senderId: currentUser.id,
      receiverId: chatPartnerId,
      message: message,
      timestamp: serverTimestamp(),
      fileUrl: fileUrl || null,
    };
    
    // Use a batch write to ensure the message is delivered to both parties atomically.
    const batch = writeBatch(firestore);

    // 1. Add to the sender's chat collection
    const senderChatRef = collection(firestore, 'users', currentUser.id, 'chats', chatPartnerId, 'messages');
    batch.set(doc(senderChatRef), messagePayload);
    
    // 2. Add to the receiver's chat collection
    const receiverChatRef = collection(firestore, 'users', chatPartnerId, 'chats', currentUser.id, 'messages');
    batch.set(doc(receiverChatRef), messagePayload);

    try {
        await batch.commit();
        setNewMessage('');
    } catch (error) {
        console.error("Failed to send message:", error);
    }
  }


  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleAddAttachment = (url: string, message: string) => {
    sendMessage(message || url, url);
  }
  
  if (!currentUser || !chatPartner) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select a conversation</p></div>;

  return (
    <div className="flex h-full flex-col">
       <CardHeader className="flex-row items-center border-b">
         <Avatar className="h-9 w-9">
            <AvatarImage src={PlaceHolderImages.find(p => p.id === chatPartner.avatar)?.imageUrl} alt={chatPartner.name} />
            <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
         </Avatar>
         <div className="ml-4">
            <CardTitle className="text-base">{chatPartner.name}</CardTitle>
         </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoading && <p className="text-center text-muted-foreground">Loading messages...</p>}
          {!isLoading && messages?.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Send a message to start the conversation!
            </div>
          )}
          {messages && messages.map((msg, index) => {
            const sender = users.find(u => u.id === msg.senderId);
            const userAvatar = PlaceHolderImages.find(img => img.id === sender?.avatar);
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = (msg.timestamp as any)?.toDate ? (msg.timestamp as any).toDate() : new Date();

            return (
              <div
                key={index} // Using index as key because IDs might not be unique across batched writes temporarily
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={sender?.name} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {!isCurrentUser && <span className="text-xs text-muted-foreground">{sender?.name}</span>}
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
