'use client';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Link as LinkIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { AddChatAttachmentDialog } from '../../projects/[id]/components/add-chat-attachment-dialog';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebaseServices, useMemoFirebase, useTypingIndicator } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { UserPresence } from '@/components/ui/user-presence';
import { TypingIndicator } from './TypingIndicator';

type SupportChatRoomProps = {
  chatPartner: User;
};

export function SupportChatRoom({ chatPartner }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore } = useFirebaseServices();
  const { getOrCreateChat, sendMessage, markChatNotificationsAsRead } = useData();
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { typingUsers, setTyping } = useTypingIndicator(chatId);
  
  // Get or create chat ID
  useEffect(() => {
    if (currentUser && chatPartner) {
        getOrCreateChat(chatPartner.id).then(setChatId);
    }
  }, [currentUser, chatPartner, getOrCreateChat]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  // Mark messages as read when the chat room is opened or new messages arrive
  useEffect(() => {
    if (!chatId || !firestore || !currentUser || !messages || messages.length === 0) return;

    const unreadMessages = messages.filter(msg => 
        msg.senderId !== currentUser.id && !(msg.readBy || []).includes(currentUser.id)
    );

    if (unreadMessages.length > 0) {
        const batch = writeBatch(firestore);
        unreadMessages.forEach(msg => {
            const msgRef = doc(firestore, 'chats', chatId, 'messages', msg.id);
            batch.update(msgRef, {
                readBy: arrayUnion(currentUser.id)
            });
        });

        batch.commit().catch(err => console.error("Failed to mark messages as read:", err));
    }
     
    // Also mark related notifications as read
    markChatNotificationsAsRead(chatId);

  }, [messages, chatId, firestore, currentUser, markChatNotificationsAsRead]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    if ((messages?.length || 0) > 0) {
      scrollToBottom();
    }
  }, [messages]);


  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim()) return;
    sendMessage(chatId, newMessage);
    setTyping(false);
    setNewMessage('');
  };

  const handleAddAttachment = (url: string, message: string) => {
    if (!chatId) return;
    sendMessage(chatId, message || url, url);
    setTyping(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(true);
  }
  
  if (!currentUser || !chatPartner) return null;

  const partnerAvatar = PlaceHolderImages.find(p => p.id === chatPartner.avatar);

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex-row items-center border-b">
         <Avatar>
            <AvatarImage src={partnerAvatar?.imageUrl} alt={chatPartner.name} />
            <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
        </Avatar>
         <div className="ml-4">
            <CardTitle className="text-base">{chatPartner.name}</CardTitle>
            <UserPresence userId={chatPartner.id} />
         </div>
      </CardHeader>
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
                        {msg.type === 'media' ? (
                            <div className="space-y-2">
                            <a
                                href={msg.mediaURL || '#'}
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
                                    {msg.mediaURL}
                                </p>
                                </div>
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </a>
                            {msg.text && msg.text !== msg.mediaURL && (
                                <p className="text-sm">{msg.text}</p>
                            )}
                            </div>
                        ) : (
                            <p className="text-sm">{msg.text}</p>
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
        <TypingIndicator typingUserIds={typingUsers} />
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
                onChange={handleInputChange}
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
