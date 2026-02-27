'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, X, Minus, Maximize2, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { sounds } from '@/lib/sounds';
import type { ChatMessage, User, Client } from '@/lib/types';
import Draggable from 'react-draggable';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

const getMessageDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
};

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  teamMembers: User[];
  client: Client;
}

export function ProjectChat({ projectId, projectName, teamMembers, client }: ProjectChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const { user: currentUser } = useAuth();
  const { firestore, auth } = useFirebaseServices();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !projectId) return null;
    return query(
      collection(firestore, 'projects', projectId, 'chat', 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, projectId]);

  const { data: messages } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages && isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Mark messages as read
  useEffect(() => {
    if (!messages || !firestore || !currentUser || !isOpen || isMinimized) return;
    
    const authUid = auth?.currentUser?.uid ?? currentUser.id;
    const unreadMessages = messages.filter(
      msg => msg.senderId !== currentUser.id && 
             !(msg.readBy || []).includes(authUid)
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg) => {
        const msgRef = doc(firestore, 'projects', projectId, 'chat', 'messages', msg.id);
        await updateDoc(msgRef, { readBy: arrayUnion(authUid) });
      });
    }
  }, [messages, firestore, currentUser, auth, projectId, isOpen, isMinimized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firestore || !currentUser) return;

    if (currentUser.role === 'team') {
      return;
    }

    try {
      await addDoc(
        collection(firestore, 'projects', projectId, 'chat', 'messages'),
        {
          text: newMessage.trim(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          timestamp: serverTimestamp(),
          readBy: [currentUser.id],
          reactions: {}
        }
      );

      sounds.messageSent();
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!firestore || !currentUser) return;
    
    const msgRef = doc(firestore, 'projects', projectId, 'chat', 'messages', messageId);
    const msg = messages?.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = (msg as any).reactions || {};
    const userIds = reactions[emoji] || [];
    const hasReacted = userIds.includes(currentUser.id);

    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted 
        ? arrayRemove(currentUser.id) 
        : arrayUnion(currentUser.id)
    });
  };

  const unreadCount = messages?.filter(
    msg => msg.senderId !== currentUser?.id && 
           !(msg.readBy || []).includes(currentUser?.id || '')
  ).length || 0;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-pink-500 hover:scale-110 transition-transform z-50"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>
    );
  }

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="parent">
      <div
        ref={nodeRef}
        className={cn(
          "fixed bottom-6 right-6 bg-[#13131F] border border-primary/20 rounded-2xl shadow-2xl z-50 flex flex-col",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        )}
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        <div className="drag-handle cursor-move flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm text-white truncate max-w-[200px]">
                {projectName}
              </p>
              <p className="text-xs text-gray-400">Project Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-400"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-3 pb-4">
                {messages?.map((msg) => {
                  const isCurrentUser = msg.senderId === currentUser?.id;
                  const date = getMessageDate(msg.timestamp);
                  const sender = [client as unknown as User, ...teamMembers].find(u => u.id === msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2',
                        isCurrentUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={sender?.photoURL || PlaceHolderImages.find(p => p.id === sender?.avatar)?.imageUrl} />
                          <AvatarFallback className="text-[10px]">{sender?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn('flex flex-col max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
                        {!isCurrentUser && (
                          <p className="text-[10px] text-gray-400 mb-1">{sender?.name}</p>
                        )}
                        
                        <div className="group relative">
                          <div
                            className={cn(
                              'px-3 py-2 rounded-2xl text-sm break-words',
                              isCurrentUser
                                ? 'bg-gradient-to-br from-primary to-pink-500 text-white rounded-br-sm shadow-lg shadow-primary/10'
                                : 'bg-[#1E1E2A] border border-white/10 text-gray-200 rounded-bl-sm'
                            )}
                          >
                            <p>{msg.text}</p>
                          </div>

                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            isCurrentUser ? "left-[-80px]" : "right-[-80px]"
                          )}>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/40 border border-white/10 hover:bg-white/10">
                                  <Smile className="h-4 w-4 text-gray-400" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1 border-primary/20 bg-[#1E1E2A] rounded-full shadow-2xl">
                                <div className="flex gap-1">
                                  {EMOJI_OPTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(msg.id, emoji)}
                                      className="text-xl hover:scale-125 transition-transform p-1"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={cn("flex flex-wrap gap-1 mt-1", isCurrentUser ? "justify-end" : "justify-start")}>
                              {Object.entries(msg.reactions).map(([emoji, uids]) => {
                                if ((uids as string[]).length === 0) return null;
                                const hasReacted = (uids as string[]).includes(currentUser?.id || '');
                                return (
                                  <div
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className={cn(
                                      'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] cursor-pointer border',
                                      hasReacted ? 'bg-primary/20 border-primary/50' : 'bg-black/20 border-white/5 hover:border-white/20'
                                    )}
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-gray-400">{(uids as string[]).length}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <p className="text-[9px] text-gray-500 mt-1">
                          {format(date, 'p')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/5 bg-black/20">
              {currentUser?.role === 'team' ? (
                <div className="text-center text-[11px] text-gray-500 font-medium bg-white/5 py-2 rounded-lg border border-white/5">
                  👀 Read-only mode - Team members cannot send messages
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/40 border-white/10 rounded-full h-10 px-4 text-sm focus:ring-primary/50 focus:border-primary/50"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim()}
                    className="rounded-full h-10 w-10 bg-gradient-to-br from-primary to-pink-500 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
