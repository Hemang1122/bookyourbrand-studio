'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices, useCollection, useMemoFirebase, useUserStatus } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, X, Minus, Maximize2, Smile, Paperclip, Mic, Trash2, Play, Pause, Loader2, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { sounds } from '@/lib/sounds';
import type { ChatMessage, User, Client } from '@/lib/types';
import Draggable from 'react-draggable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useData } from '../../../data-provider';
import { useSearchParams } from 'next/navigation';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

const getMessageDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
};

const VoiceNotePlayer = ({ audioUrl, duration, isCurrentUser }: { audioUrl: string; duration: number; isCurrentUser: boolean; }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => { audio.removeEventListener('timeupdate', handleTimeUpdate); audio.removeEventListener('ended', handleEnded); };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
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
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 shrink-0" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <div className="flex-1">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", isCurrentUser ? 'bg-white' : 'bg-primary')} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="text-xs font-mono shrink-0">{formatTime(isPlaying ? currentTime : duration)}</span>
    </div>
  );
};

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  teamMembers: User[];
  client: Client;
}

export default function ProjectChat({ projectId, projectName, teamMembers, client }: ProjectChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user: currentUser } = useAuth();
  const { firestore, auth, firebaseApp, functions } = useFirebaseServices();
  const { addNotification, markChatNotificationsAsRead, users } = useData();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(null);
  const clientStatus = useUserStatus(client.id);

  const {
    isRecording: voiceRecording,
    recordingDuration: voiceDuration,
    audioBlob: voiceBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecorder
  } = useVoiceRecorder();

  // Check for deep-link to open chat
  useEffect(() => {
    if (searchParams.get('openChat') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !projectId) return null;
    return query(
      collection(firestore, 'projects', projectId, 'chat-messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, projectId]);

  const { data: messages } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (messages && isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

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
        const msgRef = doc(firestore, 'projects', projectId, 'chat-messages', msg.id);
        await updateDoc(msgRef, { readBy: arrayUnion(authUid) });
      });
    }

    markChatNotificationsAsRead(projectId);
  }, [messages, firestore, currentUser, auth, projectId, isOpen, isMinimized, markChatNotificationsAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firestore || !currentUser) return;

    if (currentUser.role === 'team') return;

    try {
      const messageText = newMessage.trim();
      
      await addDoc(
        collection(firestore, 'projects', projectId, 'chat-messages'),
        {
          text: messageText,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          timestamp: serverTimestamp(),
          readBy: [currentUser.id],
          reactions: {},
          type: 'text'
        }
      );

      // RESTRICTION: For administrative attention, only notify "Niddhi" if message is from a client
      const niddhi = (users || []).find(u => u.role === 'admin' && u.name.toLowerCase().includes('niddhi'));
      const adminIds = niddhi ? [niddhi.id] : [];
      
      const participantIds = [client.id, ...teamMembers.map(m => m.id)];
      const recipients = Array.from(new Set([...participantIds, ...adminIds]))
        .filter(id => id !== currentUser.id);
      
      if (recipients.length > 0) {
        addNotification(
          `New message in project ${projectName}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
          `/projects/${projectId}?openChat=true`,
          recipients,
          'chat',
          projectId
        );
      }

      // Trigger chat notification email if sender is admin and recipient is client with realEmail
      if (currentUser.role === 'admin' && client?.realEmail && functions) {
        const sendEmailFn = httpsCallable(functions, 'sendProjectChatNotification');
        sendEmailFn({
          clientEmail: client.realEmail || client.email,
          clientName: client.name,
          projectName: projectName,
          senderName: currentUser.name,
          messagePreview: messageText,
          projectUrl: `${window.location.origin}/projects/${projectId}?openChat=true`
        }).catch(err => console.error('Email chat notification failed:', err));
      }

      sounds.messageSent();
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !currentUser || !projectId) return;

    if (currentUser.role === 'team') {
      toast({ title: 'Permission Denied', description: 'Editors can only read messages in project chats', variant: 'destructive' });
      return;
    }

    const storage = getStorage(firebaseApp);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const fileStorageRef = storageRef(storage, `project-uploads/${projectId}/${fileName}`);

    setIsUploading(true);

    try {
      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(firestore, 'projects', projectId, 'chat-messages'), {
            text: file.name,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            timestamp: serverTimestamp(),
            type: 'media',
            mediaURL: downloadURL,
            mediaType: file.type,
            fileName: file.name,
            fileSize: file.size,
            readBy: [currentUser.id],
            reactions: {}
          });

          // Trigger email notification for file attachment as well
          if (currentUser.role === 'admin' && client?.realEmail && functions) {
            const sendEmailFn = httpsCallable(functions, 'sendProjectChatNotification');
            sendEmailFn({
              clientEmail: client.realEmail || client.email,
              clientName: client.name,
              projectName: projectName,
              senderName: currentUser.name,
              messagePreview: `Sent a file: ${file.name}`,
              projectUrl: `${window.location.origin}/projects/${projectId}?openChat=true`
            }).catch(err => console.error('Email chat notification failed:', err));
          }

          sounds.messageSent();
          setIsUploading(false);
          setUploadProgress(0);
          setTimeout(scrollToBottom, 100);
        }
      );
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendVoiceNote = async () => {
    if (!voiceBlob || !firestore || !currentUser || !projectId) return;

    if (currentUser.role === 'team') {
      toast({ title: 'Permission Denied', description: 'Editors can only read messages', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      const storage = getStorage(firebaseApp);
      const timestamp = Date.now();
      const fileName = `voice-note-${timestamp}.webm`;
      const fileStorageRef = storageRef(storage, `project-uploads/${projectId}/${fileName}`);

      const uploadTask = uploadBytesResumable(fileStorageRef, voiceBlob);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(firestore, 'projects', projectId, 'chat-messages'), {
            text: `🎤 Voice message (${formatDuration(voiceDuration)})`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            timestamp: serverTimestamp(),
            type: 'voice',
            mediaURL: downloadURL,
            duration: voiceDuration,
            readBy: [currentUser.id],
            reactions: {}
          });

          // Trigger email notification for voice note
          if (currentUser.role === 'admin' && client?.realEmail && functions) {
            const sendEmailFn = httpsCallable(functions, 'sendProjectChatNotification');
            sendEmailFn({
              clientEmail: client.realEmail || client.email,
              clientName: client.name,
              projectName: projectName,
              senderName: currentUser.name,
              messagePreview: `Sent a voice message (${formatDuration(voiceDuration)})`,
              projectUrl: `${window.location.origin}/projects/${projectId}?openChat=true`
            }).catch(err => console.error('Email chat notification failed:', err));
          }

          sounds.messageSent();
          setIsUploading(false);
          setUploadProgress(0);
          resetRecorder();
          setTimeout(scrollToBottom, 100);
        }
      );
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!firestore || !currentUser) return;
    
    const msgRef = doc(firestore, 'projects', projectId, 'chat-messages', messageId);
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
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={client.photoURL || PlaceHolderImages.find(p => p.id === client.avatar)?.imageUrl} />
                <AvatarFallback>{client.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#13131F]", clientStatus?.isOnline ? "bg-green-500" : "bg-gray-500")} />
            </div>
            <div>
              <p className="font-semibold text-sm text-white truncate max-w-[180px]">
                {projectName}
              </p>
              <p className="text-[10px] text-gray-400">
                {clientStatus?.isOnline ? 'Active now' : 'Offline'}
              </p>
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
                      
                      <div className={cn('flex flex-col gap-1 max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
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
                            {msg.type === 'media' && msg.mediaURL && (
                              <div className="space-y-2">
                                {(msg as any).mediaType?.startsWith('image/') ? (
                                  <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.mediaURL} alt={(msg as any).fileName} className="max-w-full rounded-lg cursor-pointer" />
                                  </a>
                                ) : (msg as any).mediaType?.startsWith('video/') ? (
                                  <video src={msg.mediaURL} controls className="max-w-full rounded-lg" />
                                ) : (
                                  <a 
                                    href={msg.mediaURL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold truncate">{(msg as any).fileName}</p>
                                      <p className="text-[10px] opacity-60">
                                        {((msg as any).fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <Download className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            )}

                            {msg.type === 'voice' && msg.mediaURL && (
                              <VoiceNotePlayer 
                                audioUrl={msg.mediaURL} 
                                duration={msg.duration || 0}
                                isCurrentUser={isCurrentUser}
                              />
                            )}

                            {msg.text && (msg.type !== 'media' || (msg as any).mediaType?.startsWith('image/') === false) && (
                              <p>{msg.text}</p>
                            )}
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

            <div className="p-3 border-t border-white/10 bg-black/20">
              {currentUser?.role === 'team' ? (
                <div className="text-center text-[11px] text-gray-500 font-medium bg-white/5 py-2 rounded-lg border border-white/5">
                  👀 Read-only mode - Team members cannot send messages
                </div>
              ) : voiceRecording ? (
                <div className="flex w-full items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/20" onClick={cancelRecording}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 flex items-center justify-center gap-3 bg-red-500/10 rounded-full h-10 border border-red-500/30">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500 font-mono font-bold text-sm">{formatDuration(voiceDuration)}</span>
                  </div>
                  <Button type="button" size="icon" className="rounded-full h-10 w-10 bg-gradient-to-br from-green-600 to-green-500" onClick={stopRecording}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : voiceBlob ? (
                <div className="flex w-full items-center space-x-2">
                  <Button type="button" variant="ghost" size="icon" onClick={resetRecorder}><X className="h-5 w-5" /></Button>
                  <div className="flex-1 flex items-center gap-3 bg-green-500/10 rounded-full h-10 px-4 border border-green-500/30">
                    <Play className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-mono text-xs">{formatDuration(voiceDuration)}</span>
                  </div>
                  <Button type="button" size="icon" className="rounded-full h-10 w-10 bg-gradient-to-br from-primary to-pink-500" onClick={handleSendVoiceNote} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-white" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/40 border-white/10 rounded-full h-10 px-4 text-sm focus:ring-primary/50 focus:border-primary/50"
                  />
                  {newMessage.trim() ? (
                    <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-full h-10 w-10 bg-gradient-to-br from-primary to-pink-500 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" size="icon" onClick={startRecording} className="rounded-full h-10 w-10 bg-gradient-to-br from-primary to-pink-500 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                      <Mic className="h-4 w-4" />
                    </Button>
                  )}
                </form>
              )}
              {isUploading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{uploadProgress}%</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
