
'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
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
  const { messages, addMessage, users } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const projectMessages = messages.filter(m => m.projectId === projectId)
    .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

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

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;
    addMessage({
        projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        message: newMessage,
        fileUrl: null,
    });
    setNewMessage('');
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
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
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
                             {msg.message && msg.message !== "Shared a file." && <p className="text-sm">{msg.message}</p>}
                           </div>
                        ) : (
                            <p className="text-sm">{msg.message}</p>
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
          />
          <Button type="submit" size="icon" disabled={!newMessage}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
