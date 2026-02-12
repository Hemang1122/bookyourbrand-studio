'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { AddChatAttachmentDialog } from '../../projects/[id]/components/add-chat-attachment-dialog';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebaseServices, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


type SupportChatRoomProps = {
  chatPartner: User;
};

export function SupportChatRoom({ chatPartner }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore } = useFirebaseServices();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatId = useMemo(() => {
    if (!currentUser || !chatPartner) return null;
    // Create a consistent chat ID for any two users
    return [currentUser.id, chatPartner.id].sort().join('_');
  }, [currentUser, chatPartner]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if ((messages?.length || 0) > 0) {
      scrollToBottom();
    }
  }, [messages]);


  const sendMessage = (messageText: string, mediaUrl?: string) => {
     if (!currentUser || !firestore || !chatId || (!messageText.trim() && !mediaUrl)) return;
     
     const messageType = mediaUrl ? 'media' : 'text';

     const messagesColRef = collection(firestore, 'chats', chatId, 'messages');

     const messagePayload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      messageText,
      messageType,
      mediaUrl: mediaUrl || null,
      timestamp: serverTimestamp(),
    };
    
    addDoc(messagesColRef, messagePayload);
    setNewMessage('');
  }

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleAddAttachment = (url: string, message: string) => {
    sendMessage(message || url, url);
  }
  
  if (!currentUser || !chatPartner) {
      return (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Select a contact to start chatting</p>
        </div>
      );
  }

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex-row items-center border-b">
        <div className="ml-4">
          <CardTitle className="text-base">{chatPartner.name}</CardTitle>
          <CardDescription className="text-xs capitalize">{chatPartner.role}</CardDescription>
        </div>
      </CardHeader>
  
      {/* Scrollable message area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messagesLoading && (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-12 w-1/2" />
              </div>
            )}
            {!messagesLoading && messages?.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No messages yet. Send a message to start the conversation!
              </div>
            )}
            {!messagesLoading &&
              messages?.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.id;
                const timestamp = msg.timestamp as Timestamp;
                const messageDate = timestamp?.toDate() || new Date();
  
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isCurrentUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${
                        isCurrentUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      {!isCurrentUser && (
                        <span className="text-xs text-muted-foreground">
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.mediaUrl ? (
                          <div className="space-y-2">
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 hover:bg-accent"
                            >
                              <FileText className="h-6 w-6 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  File Attachment
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {msg.mediaUrl}
                                </p>
                              </div>
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </a>
                            {msg.messageText && msg.messageText !== msg.mediaUrl && (
                              <p className="text-sm">{msg.messageText}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">{msg.messageText}</p>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-right' : 'text-left'
                        } text-muted-foreground/80`}
                      >
                        {messageDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
  
        {/* Input bar always visible */}
        <div className="border-t p-4 bg-background">
          <form
            onSubmit={handleSendTextMessage}
            className="flex w-full items-center space-x-2"
          >
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
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}