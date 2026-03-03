'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ChatMessage, User, Timestamp as FirebaseTimestamp } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Download, Loader2, Trash2, MoreVertical, Pencil, Smile, ArrowLeft, ArrowDown, Phone, Video, Reply, Pin, X, Mic, Play, Pause, PhoneOff, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useCollection, useFirebaseServices, useMemoFirebase, useTypingIndicator, useUserStatus } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, Timestamp, doc, writeBatch, arrayUnion, updateDoc, arrayRemove, where, limit, onSnapshot } from 'firebase/firestore';
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
import { TypingIndicator } from './TypingIndicator';

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
  partnerId: string;
}) => {
  if (msg.senderId !== currentUserId) return null;
  
  const readBy = msg.readBy || [];
  const isRead = readBy.includes(partnerId);
  const isDelivered = readBy.length > 1 || isRead;

  if (isRead) {
    return <svg width="16" height="10" viewBox="0 0 16 10" className="text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 6-7 M6 5l3 3 6-7"/></svg>;
  }
   if (isDelivered) {
    return <svg width="16" height="10" viewBox="0 0 16 10" className="text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 6-7 M6 5l3 3 6-7"/></svg>;
  }
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5l3 3 5-7"/></svg>;
};

const EmojiPicker = ({ onSelect }: { onSelect: (emoji: string) => void }) => (
  <div className="flex gap-1 p-2 bg-[#1E1E2A] border border-primary/20 rounded-full shadow-lg">
    {EMOJI_OPTIONS.map(emoji => (
      <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:scale-125 transition-transform cursor-pointer p-1">
        {emoji}
      </button>
    ))}
  </div>
);

const VoiceNotePlayer = ({ 
  audioUrl, 
  duration, 
  isCurrentUser 
}: { 
  audioUrl: string; 
  duration: number; 
  isCurrentUser: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg min-w-[200px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      
      <div className="flex-1">
        <div className="relative h-6 flex items-center mb-1">
          <div className="absolute inset-0 flex gap-0.5 items-center">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1 rounded-full transition-colors",
                  i < (progress / 5) 
                    ? (isCurrentUser ? 'bg-white' : 'bg-primary')
                    : (isCurrentUser ? 'bg-white/30' : 'bg-primary/30')
                )}
                style={{ 
                  height: `${8 + Math.random() * 16}px` 
                }}
              />
            ))}
          </div>
        </div>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isCurrentUser ? 'bg-white' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <span className="text-xs font-mono shrink-0">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  );
};

type SupportChatRoomProps = {
  chatPartner: User;
  onBack: () => void;
};

export function SupportChatRoom({ chatPartner, onBack }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore, firebaseApp, auth } = useFirebaseServices();
  const { getOrCreateChat, sendMessage, markChatNotificationsAsRead } = useData();
  const [chatId, setChatId] = useState<string | null>(null);
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob || !chatId || !firebaseApp || !currentUser) return;
    
    setIsUploading(true);
    
    try {
      const storage = getStorage(firebaseApp);
      const timestamp = Date.now();
      const fileName = `voice-note-${timestamp}.webm`;
      const fileStorageRef = storageRef(
        storage, 
        `chat-uploads/${chatId}/${fileName}`
      );
      
      const task = uploadBytesResumable(fileStorageRef, audioBlob);
      uploadTaskRef.current = task;
      
      task.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / 
                           snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          toast({ 
            title: 'Upload Failed', 
            description: error.message, 
            variant: 'destructive' 
          });
          setIsUploading(false);
          uploadTaskRef.current = null;
        },
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          
          if (!firestore) return;
          await addDoc(
            collection(firestore, 'chats', chatId, 'messages'),
            {
              text: `🎤 Voice message (${formatDuration(recordingDuration)})`,
              senderId: currentUser.id,
              timestamp: serverTimestamp(),
              type: 'voice',
              mediaURL: downloadURL,
              duration: recordingDuration,
              readBy: [currentUser.id]
            }
          );
          
          sounds.messageSent();
          setIsUploading(false);
          setUploadProgress(0);
          uploadTaskRef.current = null;
          resetRecorder();
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      );
    } catch (error: any) {
      toast({ 
        title: 'Upload Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };

  useEffect(() => {
    if (currentUser && chatPartner) {
        getOrCreateChat(chatPartner.id).then(setChatId);
    }
  }, [currentUser, chatPartner, getOrCreateChat]);

  // Listen for missed calls
  useEffect(() => {
    if (!firestore || !chatId || !currentUser) return;
    
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('chatId', '==', chatId),
      where('type', '==', 'missed_call'),
      where('recipients', 'array-contains', currentUser.id),
      orderBy('timestamp', 'desc'),
      limit(3)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((n: any) => !(n.readBy || []).includes(currentUser.id));
      setMissedCalls(calls);
    });
    
    return () => unsubscribe();
  }, [firestore, chatId, currentUser]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
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
    
    if (isScrolledToBottom) {
      scrollToBottom();
    } else {
      const newCount = (messages.filter(msg => (getMessageDate(msg.timestamp)) > new Date(Date.now() - 2000))).length;
      if(newCount > 0) {
        setNewMessagesCount(prev => prev + newCount);
      }
    }

  }, [messages, scrollToBottom]);

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
        batch.commit().catch(err => console.error("Failed to mark messages as read:", err));
        
        const incomingMessages = messages?.filter(msg => 
          msg.senderId !== currentUser.id && 
          (Date.now() - getMessageDate(msg.timestamp).getTime() < 2000)
        );
        if (incomingMessages && incomingMessages.length > 0) {
          sounds.messageReceived();
        }
    }
    markChatNotificationsAsRead(chatId);
  }, [messages, chatId, firestore, currentUser, auth, markChatNotificationsAsRead]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId || !firestore) return;
    const confirmed = window.confirm('Delete this message? This cannot be undone.');
    if (!confirmed) return;
    const msgRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    await updateDoc(msgRef, { deleted: true, text: 'This message was deleted', mediaURL: null });
  };
  
  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text || '');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!chatId || !firestore || !editingText.trim()) return;
    const msgRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    await updateDoc(msgRef, { text: editingText.trim(), edited: true, editedAt: serverTimestamp() });
    setEditingMessageId(null);
    setEditingText('');
  };
  
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!chatId || !firestore || !currentUser) return;
    const uid = auth?.currentUser?.uid || currentUser.id;
    const msgRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    const msg = messages?.find(m => m.id === messageId);
    if (!msg) return;
    const currentReactions = (msg as any).reactions || {};
    const currentUids: string[] = currentReactions[emoji] || [];
    const hasReacted = currentUids.includes(uid);
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid)
    });
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim() || !currentUser) return;
    
    let replyToData: ChatMessage['replyTo'] | undefined = undefined;
    if (replyingTo) {
        replyToData = {
            messageId: replyingTo.id,
            text: replyingTo.text || 'Media file',
            senderId: replyingTo.senderId,
            senderName: replyingTo.senderId === currentUser.id 
                ? currentUser.name 
                : chatPartner.name,
        };
    }

    sendMessage(chatId, newMessage, undefined, replyToData);
    sounds.messageSent();
    setTyping(false);
    setNewMessage('');
    setReplyingTo(null); 
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
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
          uploadTaskRef.current = null;
        },
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          sendMessage(chatId, file.name, downloadURL);
          sounds.messageSent();
          setIsUploading(false);
          setUploadProgress(0);
          uploadTaskRef.current = null;
          setTimeout(() => {
            scrollToBottom('smooth');
          }, 100);
        }
      );
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(true);
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    }
  }

  const handlePinMessage = async (messageId: string) => {
    if (!chatId || !firestore) return;
    const msgRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    const msg = messages?.find(m => m.id === messageId);
    if (!msg) return;
    
    await updateDoc(msgRef, { 
      pinned: !((msg as any).pinned)
    });
    
    toast({ 
      title: (msg as any).pinned ? 'Message unpinned' : 'Message pinned',
      description: 'Pinned messages appear at the top'
    });
  };
  
  if (!currentUser || !chatPartner) return null;
  const userStatus = useUserStatus(chatPartner.id);

  const pinnedMessages = useMemo(() => {
    return (messages || []).filter(m => (m as any).pinned);
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#13131F] to-[#0F0F1A] text-white relative">
      {isRinging && incomingCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#13131F] border border-primary/20 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/20 ring-offset-4 ring-offset-[#13131F]">
                <AvatarImage src={chatPartner.photoURL || PlaceHolderImages.find(p => p.id === chatPartner.avatar)?.imageUrl} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-pink-500">{chatPartner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-bold text-white mb-2">
                {chatPartner.name}
              </h3>
              <p className="text-primary flex items-center justify-center gap-2 font-medium">
                <Phone className="h-4 w-4 animate-pulse" />
                Incoming voice call...
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-full border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold"
                onClick={() => rejectCall(incomingCall.id)}
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Decline
              </Button>
              <Button
                className="flex-1 h-14 rounded-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold"
                onClick={() => answerCall(incomingCall.id)}
              >
                <PhoneIncoming className="h-5 w-5 mr-2" />
                Answer
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="h-[70px] shrink-0 flex items-center px-4 bg-[#13131F]/80 backdrop-blur-xl border-b border-white/5 z-10">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
            <ArrowLeft />
        </Button>
        <Avatar className="h-10 w-10">
            <AvatarImage src={chatPartner.photoURL || PlaceHolderImages.find(p => p.id === chatPartner.avatar)?.imageUrl} alt={chatPartner.name} />
            <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
            <h3 className="font-bold text-base">{chatPartner.name}</h3>
            <p className="text-xs text-gray-400">
              {userStatus?.isOnline ? (
                <span className="text-green-400">● Online</span>
              ) : userStatus?.last_seen ? (
                <>Last seen {formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}</>
              ) : (
                'Offline'
              )}
            </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "text-gray-400 hover:text-white hover:bg-white/10",
                isInCall && "text-green-500 bg-green-500/10"
              )}
              onClick={() => {
                if (isInCall) {
                  endCall();
                } else {
                  startCall(chatPartner.id);
                }
              }}
            >
              {isInCall ? <PhoneOff /> : <Phone />}
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10"><Video /></Button>
        </div>
      </header>
      
      {currentUser.role === 'client' && (
        <div className="p-3 text-center border-b border-white/5 bg-gradient-to-r from-primary/10 to-pink-500/10 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" style={{boxShadow: '0 0 10px #7C3AED'}} />
          <p className="font-signature text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500">
            BookYourBrands support team will respond within 24 hours.
          </p>
        </div>
      )}

      {isInCall && (
        <div className="p-3 text-center border-b border-white/5 bg-gradient-to-r from-green-600/20 to-green-500/20 backdrop-blur-md">
          <div className="flex items-center justify-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm text-green-400 font-semibold uppercase tracking-wider">
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'connected' && 'Voice call active'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-3 rounded-full ml-4"
              onClick={endCall}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      )}

      {missedCalls.length > 0 && (
        <div className="border-b border-white/10 bg-red-500/10 backdrop-blur-md">
          {missedCalls.map(call => (
            <div 
              key={call.id}
              className="p-3 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <PhoneMissed className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400">
                    Missed voice call
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(getMessageDate(call.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-500 hover:bg-green-500/10 rounded-full h-8 px-3"
                  onClick={() => startCall(chatPartner.id)}
                >
                  <Phone className="h-4 w-4 mr-1.5" />
                  Call back
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-white/10"
                  onClick={async () => {
                    if (firestore) {
                      await updateDoc(doc(firestore, 'notifications', call.id), { 
                        readBy: arrayUnion(currentUser.id) 
                      });
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

       <div className="flex-1 flex flex-col overflow-hidden relative">
        {pinnedMessages.length > 0 && (
          <div className="border-b border-white/10 bg-primary/10 backdrop-blur-xl">
            <div className="p-3 flex items-center gap-3 overflow-x-auto">
              <Pin className="h-4 w-4 text-primary shrink-0" />
              <div className="flex gap-2 overflow-x-auto">
                {pinnedMessages
                  .slice(0, 3)
                  .map(pinnedMsg => (
                  <div 
                    key={pinnedMsg.id}
                    className="px-3 py-2 rounded-lg bg-white/5 
                               border border-white/10 cursor-pointer 
                               hover:bg-white/10 transition-colors 
                               min-w-[200px]"
                    onClick={() => {
                      // TODO: Scroll to this message
                    }}
                  >
                    <p className="text-xs text-primary font-semibold mb-1">
                      {pinnedMsg.senderId === currentUser.id 
                        ? 'You' : chatPartner.name}
                    </p>
                    <p className="text-sm text-white truncate">
                      {pinnedMsg.text || '📎 Media'}
                    </p>
                  </div>
                ))}
              </div>
              {pinnedMessages.length > 3 && (
                <Badge variant="secondary" className="shrink-0">
                  +{pinnedMessages.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
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
                    <div className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start', isCurrentUser ? 'animate-slideInRight' : 'animate-slideInLeft')}>
                      <div className={cn('flex flex-col gap-1 max-w-[65%]', isCurrentUser ? 'items-end' : 'items-start')}>
                        <div className="group relative">
                          {(msg as any).pinned && (
                            <div className="absolute -top-2 -right-2 bg-primary 
                                            rounded-full p-1 shadow-lg z-10">
                              <Pin className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className={cn(
                              'px-4 py-2 text-sm break-words',
                              isCurrentUser ? 'bg-gradient-to-br from-primary to-pink-500 text-white rounded-t-2xl rounded-bl-2xl shadow-lg' : 'bg-[#1E1E2A] border border-white/10 text-gray-200 rounded-t-2xl rounded-br-2xl',
                          )}>
                             {(msg as any).replyTo && (
                              <div className="mb-2 p-2 rounded-lg bg-black/20 
                                              border-l-2 border-primary/50 cursor-pointer">
                                <p className="text-xs text-primary font-semibold">
                                  {(msg as any).replyTo.senderName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {(msg as any).replyTo.text}
                                </p>
                              </div>
                            )}
                             {editingMessageId === msg.id ? (
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(msg.id); } if (e.key === 'Escape') setEditingMessageId(null); }} autoFocus className="text-sm bg-black/30 border-white/20 h-9" />
                                    <div className="flex gap-1 justify-end">
                                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                        <Button size="sm" className="h-6 text-xs px-2 bg-white/20 hover:bg-white/30" onClick={() => handleSaveEdit(msg.id)}>Save</Button>
                                    </div>
                                </div>
                            ) : msg.deleted ? (
                                <p className="text-sm italic text-gray-400">🚫 This message was deleted</p>
                            ) : msg.mediaURL && msg.mediaURL.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                                <div className="space-y-2">
                                  <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.mediaURL} alt={msg.text || 'Image'} className="max-w-[280px] max-h-[350px] rounded-lg object-cover cursor-pointer" />
                                  </a>
                                  {msg.text && !msg.mediaURL.includes(msg.text) && <p>{msg.text}</p>}
                                </div>
                            ) : msg.type === 'voice' && msg.mediaURL ? (
                                <VoiceNotePlayer 
                                  audioUrl={msg.mediaURL} 
                                  duration={(msg as any).duration || 0}
                                  isCurrentUser={isCurrentUser}
                                />
                              ) : msg.mediaURL ? (
                                <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2 p-3 rounded-lg text-sm font-medium", isCurrentUser ? 'bg-white/10 hover:bg-white/20' : 'bg-black/20 hover:bg-black/30')}>
                                    <FileText className={cn("h-5 w-5 shrink-0", isCurrentUser ? 'text-white' : 'text-primary')} />
                                    <span className="truncate max-w-[180px]">{msg.text || 'Download file'}</span>
                                    <Download className="h-5 w-5 shrink-0 ml-auto" />
                                </a>
                            ) : (<p>{msg.text}</p>)}
                          </div>
                          
                          {!msg.deleted && (
                            <div className={cn("absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", isCurrentUser ? 'left-[-80px]' : 'right-[-80px]')}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-[#1E1E2A] border border-white/10 shadow-md hover:bg-primary/20"><Smile className="h-4 w-4 text-gray-400" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-primary/20"><EmojiPicker onSelect={(emoji) => { handleReaction(msg.id, emoji) }} /></PopoverContent>
                                </Popover>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-[#1E1E2A] border border-white/10 shadow-md hover:bg-primary/20"><MoreVertical className="h-4 w-4 text-gray-400" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 bg-[#1E1E2A] border-primary/20 text-white">
                                        <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="cursor-pointer">
                                            <Reply className="h-3 w-3 mr-2" />Reply
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => handlePinMessage(msg.id)} className="cursor-pointer">
                                            <Pin className="h-3 w-3 mr-2" />
                                            {(msg as any).pinned ? 'Unpin' : 'Pin'}
                                        </DropdownMenuItem>
                                        
                                        {isCurrentUser && msg.type !== 'media' && isWithin15Minutes(msg) && (
                                            <DropdownMenuItem onClick={() => startEditing(msg)} className="cursor-pointer">
                                                <Pencil className="h-3 w-3 mr-2" />Edit
                                            </DropdownMenuItem>
                                        )}
                                        
                                        {isCurrentUser && (
                                            <DropdownMenuItem 
                                                onClick={() => handleDeleteMessage(msg.id)} 
                                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" />Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                           )}
                        </div>

                         {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={cn("flex flex-wrap gap-1 mt-1", isCurrentUser ? 'justify-end' : 'justify-start')}>
                                {Object.entries(msg.reactions).map(([emoji, uids]) => {
                                    if ((uids as string[]).length === 0) return null;
                                    const hasReacted = (uids as string[]).includes(currentUser.id);
                                    return (
                                        <div key={emoji} onClick={() => handleReaction(msg.id, emoji)} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer", hasReacted ? 'bg-primary/20 border border-primary/50' : 'bg-[#1E1E2A] border border-white/10 hover:border-primary/50')}>
                                            <span>{emoji}</span>
                                            <span className="text-gray-300">{(uids as string[]).length}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className={cn("text-[10px] mt-1 flex items-center gap-1", isCurrentUser ? 'justify-end' : 'text-left', 'text-gray-500')}>
                            {format(date, 'p')}
                             {msg.edited && !msg.deleted && (<span className="italic text-gray-500">(edited)</span>)}
                            {isCurrentUser && <MessageTicks msg={msg} currentUserId={currentUser.id} partnerId={chatPartner.id} />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
            })}
            </div>
        </ScrollArea>
        
        {showScrollToBottom && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-24 right-6 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg animate-bounce"
            onClick={() => scrollToBottom('smooth')}
          >
            <ArrowDown className="h-5 w-5" />
             {newMessagesCount > 0 && <Badge className="absolute -top-2 -right-2">{newMessagesCount}</Badge>}
          </Button>
        )}
        
        <TypingIndicator typingUserIds={typingUsers} />
        {isUploading && (
          <div className="px-4 py-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading... {uploadProgress}%</span>
              <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-pink-500 h-full rounded-full transition-all animate-shimmer" style={{ width: `${uploadProgress}%`, backgroundSize: '200% 100%' }} />
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={() => { uploadTaskRef.current?.cancel(); setIsUploading(false); }}>Cancel</Button>
            </div>
          </div>
        )}
        {replyingTo && (
          <div className="px-4 py-2 bg-white/5 border-t border-white/10 
                          flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-1 h-10 bg-gradient-to-b from-primary 
                              to-pink-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-semibold">
                  Replying to {replyingTo.senderId === currentUser.id 
                    ? 'yourself' : chatPartner.name}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {replyingTo.text || 'Media file'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="border-t border-white/5 p-4 bg-[#13131F]/90 backdrop-blur-xl">
            {isRecording ? (
                // Recording UI
                <div className="flex w-full items-center space-x-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:bg-red-500/20"
                    onClick={cancelRecording}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 flex items-center justify-center gap-3 bg-red-500/10 rounded-full px-6 py-3 border border-red-500/30">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500 font-mono font-bold text-lg">
                    {formatDuration(recordingDuration)}
                    </span>
                    <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div 
                        key={i}
                        className="w-1 bg-red-500 rounded-full animate-pulse"
                        style={{ 
                            height: `${12 + Math.random() * 12}px`,
                            animationDelay: `${i * 0.1}s`
                        }}
                        />
                    ))}
                    </div>
                </div>
                
                <Button 
                    type="button"
                    size="icon" 
                    className="rounded-full h-11 w-11 bg-gradient-to-br from-green-600 to-green-500"
                    onClick={stopRecording}
                >
                    <Send className="h-5 w-5" />
                </Button>
                </div>
            ) : audioBlob ? (
                // Preview recorded voice note
                <div className="flex w-full items-center space-x-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                    resetRecorder();
                    }}
                >
                    <X className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 flex items-center gap-3 bg-green-500/10 rounded-full px-6 py-3 border border-green-500/30">
                    <Play className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-mono">
                    {formatDuration(recordingDuration)}
                    </span>
                    <div className="flex-1 h-1 bg-green-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full animate-pulse" />
                    </div>
                </div>
                
                <Button 
                    type="button"
                    size="icon" 
                    className="rounded-full h-11 w-11 bg-gradient-to-br from-primary to-pink-500"
                    onClick={handleSendVoiceNote}
                    disabled={isUploading}
                >
                    {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                    <Send className="h-5 w-5" />
                    )}
                </Button>
                </div>
            ) : (
                // Normal text input UI
                <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                <Button type="button" variant="ghost" size="icon" className="hover:bg-primary/20" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />}
                </Button>
                <div className="relative flex-1">
                    <Input value={newMessage} onChange={handleInputChange} placeholder="Type a message..." autoComplete="off" className="bg-black/20 border-primary/20 rounded-full h-11 px-6 focus:ring-primary/50 focus:border-primary/50 text-white placeholder:text-gray-500"/>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/20"><Smile className="text-gray-400" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-primary/20 mb-2"><EmojiPicker onSelect={(emoji) => setNewMessage(prev => prev + emoji)} /></PopoverContent>
                    </Popover>
                </div>
                
                {newMessage.trim() ? (
                    <Button type="submit" size="icon" className="rounded-full h-11 w-11 bg-gradient-to-br from-primary to-pink-500 hover:scale-105 active:scale-95 transition-all">
                    <Send className="h-5 w-5" />
                    </Button>
                ) : (
                    <Button 
                    type="button"
                    size="icon" 
                    className="rounded-full h-11 w-11 bg-gradient-to-br from-primary to-pink-500 hover:scale-105 active:scale-95 transition-all"
                    onClick={startRecording}
                    >
                    <Mic className="h-5 w-5" />
                    </Button>
                )}
                </form>
            )}
            </div>
        </div>
    </div>
  );
}
