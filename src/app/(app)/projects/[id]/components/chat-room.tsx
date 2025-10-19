'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-client';
import { useData } from '../../../data-provider';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import { FieldValue } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';


type ChatRoomProps = {
  projectId: string;
};

// For simplicity, we'll use a fixed chat ID per project.
const CHAT_ID = 'main-chat';

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user: currentUser } = useAuth();
  const { triggerNotification, addNotification, projects, users } = useData();
  const prevMessagesCount = useRef(0);
  const project = projects.find(p => p.id === projectId);
  const firestore = useFirestore();

  // Simulate receiving messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (!project || !currentUser) return;
      const participants = [...project.team, project.client];
      const otherParticipant = participants.find(p => p.id !== currentUser.id && p.role !== 'admin');
      
      if (otherParticipant && Math.random() > 0.8) {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: otherParticipant.id,
          senderName: otherParticipant.name,
          senderAvatar: otherParticipant.avatar,
          message: `This is a simulated message about project ${project.name}.`,
          timestamp: new Date() as unknown as FieldValue,
          fileUrl: null,
        };
        addDocumentNonBlocking(collection(firestore, 'messages'), newMessage);
        setMessages(prev => [...prev, newMessage]);
      }
    }, 5000); // Add a new message every 5 seconds on average

    return () => clearInterval(interval);
  }, [project, currentUser]);

  
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
     if (!currentUser || !project) return;
     
     const messagePayload: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message: message,
      timestamp: new Date() as unknown as FieldValue,
      fileUrl: fileUrl || null,
    };
    
    addDocumentNonBlocking(collection(firestore, 'messages'), messagePayload);
    setMessages(prev => [...prev, messagePayload]);
    addNotification(`sent a new message in project "${project.name}".`, projectId);
  }


  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    sendMessage(newMessage);
    setNewMessage('');
  };

  const handleAddAttachment = (url: string, message: string) => {
    sendMessage(message || "shared a file", url);
  }
  
  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = new Date(); // Simplified for mock

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                   <div className="h-8 w-8" />
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
                   <div className="h-8 w-8" />
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
