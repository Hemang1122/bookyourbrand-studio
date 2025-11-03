'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText, Reply, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import { Timestamp } from 'firebase/firestore';

type ChatRoomProps = {
  projectId: string;
};

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { messages: serverMessages, addMessage } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const projectMessages = useMemo(() => {
    if (!serverMessages) return [];
    return serverMessages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
  }, [serverMessages, projectId]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages]);

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

  const handleAddAttachment = (url: string, message: string) => {
    if (!currentUser) return;
    addMessage({
        projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        message: message || "Shared a file.",
        fileUrl: url,
        messageType: 'file'
    });
  }
  
  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {projectMessages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                    <div className={`relative rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                       {msg.replyTo && (
                         <div className="p-2 mb-2 border-l-2 border-primary-foreground/50 bg-black/10 rounded-md">
                            <p className="text-xs font-semibold">{msg.replyTo.senderName}</p>
                            <p className="text-xs opacity-80 truncate">{msg.replyTo.message}</p>
                         </div>
                       )}

                       {msg.fileUrl ? (
                           <div className="space-y-2">
                             <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 hover:bg-accent">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">File Attachment</p>
                                </div>
                                <LinkIcon className="h-4 w-4 text-muted-foreground"/>
                             </a>
                             {msg.message && msg.message !== "Shared a file." && <p className="text-sm">{msg.message}</p>}
                           </div>
                        ) : (
                           <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                         {!isCurrentUser && (
                            <Button size="icon" variant="ghost" className="absolute -right-10 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setReplyTo(msg)}>
                                <Reply className="h-4 w-4" />
                            </Button>
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
  );
}
