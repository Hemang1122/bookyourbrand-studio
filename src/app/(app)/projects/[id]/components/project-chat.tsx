'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User, Project } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebaseServices, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../../data-provider';
import { sendPushNotificationFlow } from '@/ai/flows/send-push-notification';

type ProjectChatProps = {
  project: Project;
};

export function ProjectChat({ project }: ProjectChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore } = useFirebaseServices();
  const { addNotification, users } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects', project.id, 'chat', 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, project.id]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if ((messages?.length || 0) > 0) {
      scrollToBottom();
    }
  }, [messages]);


  const sendMessage = async (messageText: string, mediaUrl?: string) => {
     if (!currentUser || !firestore || (!messageText.trim() && !mediaUrl)) return;
     
     const messageType = mediaUrl ? 'media' : 'text';

     const messagesColRef = collection(firestore, 'projects', project.id, 'chat', 'messages');

     const messagePayload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: messageText,
      type: messageType,
      mediaURL: mediaUrl || null,
      timestamp: serverTimestamp(),
      readBy: [currentUser.id]
    };
    
    addDoc(messagesColRef, messagePayload);

    // Send notification
    const adminIds = users.filter(u => u.role === 'admin').map(u => u.id);
    const recipientIds = Array.from(new Set([project.client.id, ...project.team_ids, ...adminIds]));
    const finalRecipientIds = recipientIds.filter(id => id !== currentUser.id);

    if (finalRecipientIds.length > 0) {
        addNotification(
            `New message in '${project.name}': "${messageText.substring(0, 30)}..."`,
            `/projects/${project.id}?tab=chat`,
            finalRecipientIds,
            'chat',
            `project_${project.id}`
        );
        
        try {
            const recipientUsers = users.filter(u => finalRecipientIds.includes(u.id));
            const allTokens = recipientUsers.flatMap(u => u.fcmTokens || []);
            const uniqueTokens = [...new Set(allTokens)];

            if (uniqueTokens.length > 0) {
                await sendPushNotificationFlow({
                  tokens: uniqueTokens,
                  title: `New message in ${project.name}`,
                  body: `${currentUser.name}: ${messageText}`,
                  url: `/projects/${project.id}?tab=chat`
                });
            }
        } catch (error) {
            console.error("Error sending project chat push notification:", error);
        }
    }
    
    setNewMessage('');
  }

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleAddAttachment = (url: string, message: string) => {
    sendMessage(message || url, url);
  }
  
  if (!currentUser) return null;

  return (
    <div className="flex h-full flex-col">
       <CardHeader className="flex-row items-center border-b">
         <div className="ml-4">
            <CardTitle className="text-base">Project Chat</CardTitle>
            <CardDescription className="text-xs">Discussion for: {project.name}</CardDescription>
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
                No messages in this project yet. Start the conversation!
                </div>
            )}
            {!messagesLoading && messages?.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.id;
                const timestamp = msg.timestamp as Timestamp;
                const messageDate = timestamp ? timestamp.toDate() : new Date();

                return (
                <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {!isCurrentUser && <span className="text-xs text-muted-foreground">{msg.senderName}</span>}
                        <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.type === 'media' ? (
                            <div className="space-y-2">
                                <a href={msg.mediaURL || ''} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 hover:bg-accent">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">File Attachment</p>
                                        <p className="text-xs text-muted-foreground truncate">{msg.mediaURL}</p>
                                    </div>
                                    <LinkIcon className="h-4 w-4 text-muted-foreground"/>
                                </a>
                                {msg.text && msg.text !== msg.mediaURL && <p className="text-sm">{msg.text}</p>}
                            </div>
                            ) : (
                                <p className="text-sm">{msg.text}</p>
                            )}
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
                placeholder="Type a message for the project team..."
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
