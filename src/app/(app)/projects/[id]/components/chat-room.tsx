'use client';

import { useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { users } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type ChatRoomProps = {
  initialMessages: ChatMessage[];
};

export function ChatRoom({ initialMessages }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const currentUser = users[0]; // Mock current user as admin

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const userAvatar = PlaceHolderImages.find(img => img.id === msg.sender.avatar);
            const isCurrentUser = msg.sender.id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={msg.sender.name} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={userAvatar?.imageUrl} alt={msg.sender.name} data-ai-hint={userAvatar?.imageHint} />
                     <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
