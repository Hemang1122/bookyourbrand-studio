
'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ChatMessage, User, Chat } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Download, Loader2, Trash2, MoreVertical, Pencil, Smile, ArrowLeft, ArrowDown, Phone, Video, Reply, Pin, X, Mic, Play, Pause, PhoneOff, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useCollection, useFirebaseServices, useMemoFirebase, useTypingIndicator, useUserStatus } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, doc, writeBatch, arrayUnion, updateDoc, arrayRemove, where, limit, onSnapshot, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useData } from '../../data-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isSameDay, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { sounds } from '@/lib/sounds';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useVoiceCall } from '@/hooks/use-voice-call';
import TypingIndicator from './TypingIndicator';

const getMessageDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
};

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const isWithin15Minutes = (msg: ChatMessage): boolean => {
  const date = getMessageDate(msg.timestamp);
  const now = Date.now();
  return now - date.getTime() < 15 * 60 * 1000;
};

const MessageTicks = ({ msg, currentUserId, partnerId }: {
  msg: ChatMessage;
  currentUserId: string;
  partnerId?: string;
}) => {
  if (msg.senderId !== currentUserId) return null;
  
  const readBy = msg.readBy || [];
  // For shared support, we check if anyone else has read it
  const isRead = partnerId ? readBy.includes(partnerId) : readBy.length > 1;
  const isDelivered = readBy.length > 1;

  if (isRead) {
    return <svg width="16" height="10" viewBox="0 0 16 10" className="text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 6-7 M6 5l3 3 6-7"/></svg>;
  }
   if (isDelivered) {
    return <svg width="16" height="10" viewBox="0 0 16 10" className="text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 6-7 M6 5l3 3 6-7"/></svg>;
  }
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 5-7"/></svg>;
};

interface SupportChatRoomProps {
  chatPartner?: User;
  chatId?: string;
  onBack: () => void;
}

export default function SupportChatRoom({ chatPartner, chatId: propChatId, onBack }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore, firebaseApp, auth } = useFirebaseServices();
  const { getOrCreateChat, sendMessage, markChatNotificationsAsRead, users } = useData();
  const [chatId, setChatId] = useState<string | null>(propChatId || null);
  const [chatData, setChatData] = useState<Chat | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { typingUsers, setTyping } = useTypingIndicator(chatId);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTaskRef = useRef<any>(null);
  const { toast } = useToast();
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [missedCalls, setMissedCalls] = useState<any[]>([]);
  
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecorder
  } = useVoiceRecorder();

  const {
    isInCall,
    isRinging,
    incomingCall,
    callStatus,
    startCall,
    answerCall,
    rejectCall,
    endCall
  } = useVoiceCall(chatId, currentUser);

  // Initialize Chat
  useEffect(() => {
    if (propChatId) {
      setChatId(propChatId);
    } else if (chatPartner && currentUser) {
      getOrCreateChat(chatPartner.id, true).then(setChatId);
    }
  }, [chatPartner, currentUser, getOrCreateChat, propChatId]);

  // Fetch Chat Metadata
  useEffect(() => {
    if (!chatId || !firestore) return;
    const unsub = onSnapshot(doc(firestore, 'chats', chatId), (snap) => {
      if (snap.exists()) setChatData({ id: snap.id, ...snap.data() } as Chat);
    });
    return () => unsub();
  }, [chatId, firestore]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);

  const { data: messages } = useCollection<ChatMessage>(messagesQuery);
  
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      setShowScrollToBottom(false);
      setNewMessagesCount(0);
    }
  }, []);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const handleScroll = () => {
      if (viewport) {
        const isScrolledToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        setShowScrollToBottom(!isScrolledToBottom);
        if (isScrolledToBottom) {
          setNewMessagesCount(0);
        }
      }
    };
    viewport?.addEventListener('scroll', handleScroll);
    return () => viewport?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!messages) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const isScrolledToBottom = viewport ? viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 1 : true;
    if (isScrolledToBottom) scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mark Read
  useEffect(() => {
    if (!chatId || !firestore || !currentUser || !messages || messages.length === 0) return;
    const authUid = auth?.currentUser?.uid || currentUser.id;
    const unreadMessages = messages.filter(msg => msg.senderId !== currentUser.id && !(msg.readBy || []).includes(authUid));

    if (unreadMessages.length > 0) {
        const batch = writeBatch(firestore);
        unreadMessages.forEach(msg => {
            const msgRef = doc(firestore, 'chats', chatId, 'messages', msg.id);
            batch.update(msgRef, { readBy: arrayUnion(authUid) });
        });
        batch.commit();
        sounds.messageReceived();
    }
    markChatNotificationsAsRead(chatId);
  }, [messages, chatId, firestore, currentUser, auth, markChatNotificationsAsRead]);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim() || !currentUser) return;
    
    let replyToData = undefined;
    if (replyingTo) {
        replyToData = {
            messageId: replyingTo.id,
            text: replyingTo.text || 'Media file',
            senderId: replyingTo.senderId,
            senderName: replyingTo.senderName,
        };
    }

    sendMessage(chatId, newMessage, undefined, replyToData);
    sounds.messageSent();
    setTyping(false);
    setNewMessage('');
    setReplyingTo(null); 
    setTimeout(() => scrollToBottom('smooth'), 100);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!chatId || !firebaseApp) return;
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage(firebaseApp);
      const timestamp = Date.now();
      const fileStorageRef = storageRef(storage, `chat-uploads/${chatId}/${timestamp}_${file.name}`);
      const task = uploadBytesResumable(fileStorageRef, file);
      uploadTaskRef.current = task;

      task.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          sendMessage(chatId, file.name, downloadURL);
          sounds.messageSent();
          setIsUploading(false);
          setUploadProgress(0);
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      );
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob || !chatId || !firebaseApp || !currentUser) return;
    setIsUploading(true);
    try {
      const storage = getStorage(firebaseApp);
      const timestamp = Date.now();
      const fileName = `voice-note-${timestamp}.webm`;
      const fileStorageRef = storageRef(storage, `chat-uploads/${chatId}/${fileName}`);
      const task = uploadBytesResumable(fileStorageRef, audioBlob);
      task.on('state_changed', (snap) => setUploadProgress(Math.round((snap.bytesTransferred/snap.totalBytes)*100)), (err) => setIsUploading(false), async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        if (!firestore) return;
        await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
          text: `🎤 Voice message (${Math.floor(recordingDuration/60)}:${(recordingDuration%60).toString().padStart(2, '0')})`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderAvatar: currentUser.photoURL || currentUser.avatar,
          timestamp: serverTimestamp(),
          type: 'voice',
          mediaURL: downloadURL,
          duration: recordingDuration,
          readBy: [currentUser.id]
        });
        sounds.messageSent();
        setIsUploading(false);
        resetRecorder();
        setTimeout(() => scrollToBottom('smooth'), 100);
      });
    } catch (error) { setIsUploading(false); }
  };

  if (!currentUser || !chatId) return null;

  const isAdmin = currentUser.role === 'admin';
  const displayTitle = isAdmin ? (chatData?.clientName || 'Support Chat') : 'BookYourBrands Support';
  const displayAvatar = isAdmin 
    ? (chatData?.clientAvatar ? PlaceHolderImages.find(p => p.id === chatData.clientAvatar)?.imageUrl : null)
    : '/logo.png';

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#13131F] to-[#0F0F1A] text-white relative">
      <header className="h-[70px] shrink-0 flex items-center px-4 bg-[#13131F]/80 backdrop-blur-xl border-b border-white/5 z-10">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
            <ArrowLeft />
        </Button>
        <Avatar className="h-10 w-10">
            <AvatarImage src={displayAvatar || undefined} />
            <AvatarFallback>{displayTitle.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
            <h3 className="font-bold text-base">{displayTitle}</h3>
            <p className="text-xs text-gray-400">Team Inbox</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-gray-400 hover:text-white hover:bg-white/10", isInCall && "text-green-500 bg-green-500/10")}
              onClick={() => isInCall ? endCall() : (chatPartner && startCall(chatPartner.id))}
            >
              {isInCall ? <PhoneOff /> : <Phone />}
            </Button>
        </div>
      </header>
      
      {currentUser.role === 'client' && (
        <div className="p-3 text-center border-b border-white/5 bg-gradient-to-r from-primary/10 to-pink-500/10 relative">
          <p className="font-signature text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500">
            BookYourBrands support team will respond within 24 hours.
          </p>
        </div>
      )}

       <div className="flex-1 flex flex-col overflow-hidden relative">
        <ScrollArea className="flex-1 custom-scrollbar" ref={scrollAreaRef}>
            <div className="p-6 space-y-3">
              {(messages || []).map((msg, index) => {
                const prevMsg = messages?.[index - 1];
                const date = getMessageDate(msg.timestamp);
                const showDateDivider = !prevMsg || !isSameDay(date, getMessageDate(prevMsg.timestamp));
                const isCurrentUser = msg.senderId === currentUser.id;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateDivider && (
                       <div className="flex justify-center items-center py-4">
                         <div className="text-xs text-gray-400 bg-black/20 px-3 py-1 rounded-full">{isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d, yyyy')}</div>
                       </div>
                    )}
                    <div className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}>
                      <div className={cn('flex flex-col gap-1 max-w-[65%]', isCurrentUser ? 'items-end' : 'items-start')}>
                        
                        {/* Admin Name Badge for Clients */}
                        {!isCurrentUser && msg.senderRole === 'admin' && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={msg.senderAvatar} />
                              <AvatarFallback className="text-[8px]">{msg.senderName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-primary/80 font-bold uppercase tracking-tighter">
                              {msg.senderName} (Team)
                            </span>
                          </div>
                        )}

                        <div className="group relative">
                          <div className={cn(
                              'px-4 py-2 text-sm break-words rounded-2xl',
                              isCurrentUser ? 'bg-gradient-to-br from-primary to-pink-500 text-white rounded-br-sm shadow-lg' : 'bg-[#1E1E2A] border border-white/10 text-gray-200 rounded-bl-sm',
                          )}>
                             {msg.mediaURL ? (
                                <div className="space-y-2">
                                  {msg.mediaURL.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                                    <img src={msg.mediaURL} className="max-w-[280px] rounded-lg" />
                                  ) : (
                                    <a href={msg.mediaURL} target="_blank" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                      <FileText className="h-4 w-4" />
                                      <span className="truncate max-w-[150px]">{msg.text || 'File'}</span>
                                    </a>
                                  )}
                                </div>
                             ) : (<p>{msg.text}</p>)}
                          </div>
                        </div>
                        <div className={cn("text-[9px] mt-1 flex items-center gap-1 text-gray-500")}>
                            {format(date, 'p')}
                            {isCurrentUser && <MessageTicks msg={msg} currentUserId={currentUser.id} />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
            })}
            </div>
        </ScrollArea>
        
        <TypingIndicator typingUserIds={typingUsers} />
        
        <div className="border-t border-white/5 p-4 bg-[#13131F]/90 backdrop-blur-xl">
            {isRecording ? (
                <div className="flex w-full items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={cancelRecording}><Trash2 className="h-5 w-5" /></Button>
                  <div className="flex-1 flex items-center justify-center gap-3 bg-red-500/10 rounded-full py-2 border border-red-500/30">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-500 font-mono font-bold">{Math.floor(recordingDuration/60)}:{(recordingDuration%60).toString().padStart(2, '0')}</span>
                  </div>
                  <Button size="icon" className="rounded-full bg-green-600" onClick={stopRecording}><Send className="h-5 w-5" /></Button>
                </div>
            ) : audioBlob ? (
                <div className="flex w-full items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={resetRecorder}><X className="h-5 w-5" /></Button>
                  <div className="flex-1 bg-green-500/10 rounded-full py-2 border border-green-500/30 text-center text-xs text-green-500">Voice Note Ready</div>
                  <Button size="icon" className="rounded-full bg-primary" onClick={handleSendVoiceNote} disabled={isUploading}>{isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                </div>
            ) : (
                <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  <Button type="button" variant="ghost" size="icon" className="text-gray-400" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                  <Input value={newMessage} onChange={(e) => { setNewMessage(e.target.value); setTyping(true); }} placeholder="Type a message..." className="bg-black/20 border-white/10 rounded-full" />
                  {newMessage.trim() ? (
                      <Button type="submit" size="icon" className="rounded-full bg-gradient-to-br from-primary to-pink-500"><Send className="h-5 w-5" /></Button>
                  ) : (
                      <Button type="button" size="icon" className="rounded-full bg-gradient-to-br from-primary to-pink-500" onClick={startRecording}><Mic className="h-5 w-5" /></Button>
                  )}
                </form>
            )}
        </div>
      </div>
    </div>
  );
}

const MessageTicks = ({ msg, currentUserId }: { msg: ChatMessage; currentUserId: string; }) => {
  if (msg.senderId !== currentUserId) return null;
  const isRead = (msg.readBy || []).length > 1;
  return isRead ? (
    <svg width="16" height="10" viewBox="0 0 16 10" className="text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5l3 3 6-7 M6 5l3 3 6-7"/></svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500" stroke="currentColor" strokeWidth="1.5"><path d="M1 5l3 3 5-7"/></svg>
  );
};
