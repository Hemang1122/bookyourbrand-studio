'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, User, Chat } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Download, Loader2, Trash2, X, Mic, Play, Pause, Phone, PhoneOff, ArrowLeft, Smile, Check, CheckCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useCollection, useFirebaseServices, useMemoFirebase, useTypingIndicator, useUserStatus } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, doc, writeBatch, arrayUnion, onSnapshot } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useData } from '../../data-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
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
  const [chatData, setChatData] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { typingUsers, setTyping } = useTypingIndicator(chatId);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
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
    startCall,
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
      if (snap.exists()) setChatData({ id: snap.id, ...snap.data() });
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
    }
  }, []);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const handleScroll = () => {
      if (viewport) {
        const isScrolledToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        setShowScrollToBottom(!isScrolledToBottom);
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

  // Prioritize chatPartner prop (always available immediately),
  // fall back to chatData for when chatId is passed directly
  const displayTitle = isAdmin
    ? (chatPartner?.name || chatData?.clientName || 'Support Chat')
    : 'BookYourBrands Support';

  const displayAvatar = isAdmin
    ? (chatPartner?.photoURL 
        || PlaceHolderImages.find(p => p.id === chatPartner?.avatar)?.imageUrl
        || (chatData?.clientAvatar ? PlaceHolderImages.find(p => p.id === chatData.clientAvatar)?.imageUrl : null))
    : '/logo.png';

  // Also get partner's online status for the header
  const partnerUser = chatPartner || users.find(u => u.id === chatData?.clientId);
  const clientStatus = useUserStatus(partnerUser?.id || '');

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
            <p className="text-xs text-gray-400">
              {isAdmin 
                ? (partnerUser?.role === 'client' ? 'Client' : partnerUser?.role === 'team' ? 'Team Member' : 'Support Chat')
                : 'BookYourBrands Support'}
            </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <div className={cn("hidden sm:flex items-center gap-2 mr-4 text-[10px]", clientStatus?.isOnline ? "text-green-400" : "text-gray-500")}>
              <div className={cn("w-1.5 h-1.5 rounded-full", clientStatus?.isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500")} />
              {clientStatus?.isOnline ? 'Online' : 'Offline'}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-gray-400 hover:text-white hover:bg-white/10", isInCall && "text-green-500 bg-green-500/10")}
              onClick={() => isInCall ? endCall() : (partnerUser && startCall(partnerUser.id))}
            >
              {isInCall ? <PhoneOff className="text-red-500" /> : <Phone />}
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
                                    <img src={msg.mediaURL} className="max-w-[280px] rounded-lg" alt="Attachment" />
                                  ) : (
                                    <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
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
                            <MessageTicks msg={msg} currentUserId={currentUser.id} />
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

const MessageTicks = ({ msg, currentUserId }: { msg: any; currentUserId: string }) => {
  if (msg.senderId !== currentUserId) return null;
  const isRead = (msg.readBy || []).length > 1;
  
  return (
    <div className="flex items-center gap-1">
      {isRead ? (
        <CheckCheck className="h-3 w-3 text-blue-400" />
      ) : (
        <Check className="h-3 w-3 text-gray-400" />
      )}
    </div>
  );
};
