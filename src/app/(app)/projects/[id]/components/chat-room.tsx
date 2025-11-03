'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Reply, X, Loader2, Mic, StopCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

type ChatRoomProps = {
  projectId: string;
};

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { messages: serverMessages, addMessage, isLoading: isDataLoading, uploadAndAddMessage } = useData();
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isSendingVoice, setIsSendingVoice] = useState(false);


  const projectMessages = useMemo(() => {
    const combined = [...serverMessages.filter(m => m.projectId === projectId), ...optimisticMessages];
    const uniqueMessages = Array.from(new Map(combined.map(m => [m.id, m])).values());
    return uniqueMessages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
  }, [serverMessages, projectId, optimisticMessages]);

  const getScrollableViewport = useCallback(() => {
    if (scrollAreaRef.current) {
        return scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    }
    return null;
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
        const viewport = getScrollableViewport();
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, 100);
  };

  const handleScrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    const viewport = getScrollableViewport();
    if (messageElement && viewport) {
        const viewportRect = viewport.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        const scrollTop = viewport.scrollTop;
        
        const offset = messageRect.top - viewportRect.top + scrollTop - (viewportRect.height / 2) + (messageRect.height / 2);

        viewport.scrollTo({
            top: offset,
            behavior: 'smooth'
        });

        // Highlight the message briefly
        messageElement.classList.add('bg-accent/50', 'transition-all', 'duration-1000');
        setTimeout(() => {
            messageElement.classList.remove('bg-accent/50', 'transition-all', 'duration-1000');
        }, 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages, getScrollableViewport]);

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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    const tempId = `file-${uuidv4()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message: `Uploading: ${file.name}...`,
      fileUrl: null,
      messageType: 'file',
      timestamp: Timestamp.now(),
    };
    setOptimisticMessages(prev => [...prev, tempMessage]);

    try {
        const downloadURL = await uploadFile(file, `chat/${projectId}`);
        
        addMessage({
            projectId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar || '',
            message: file.name,
            fileUrl: downloadURL,
            messageType: 'file',
        });
        
        toast({ title: 'File Uploaded', description: `${file.name} has been attached to the chat.` });
    } catch (error) {
        console.error("File upload error:", error);
        toast({ title: 'Upload Failed', description: 'Could not upload the file.', variant: 'destructive' });
    } finally {
        setIsUploading(false);
        setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    } catch (err) {
      console.error("Could not start recording", err);
      toast({ title: "Recording Error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !currentUser) return;

    setIsSendingVoice(true);
    const tempId = uuidv4();
    const tempMessage: ChatMessage = {
      id: tempId,
      projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || '',
      message: 'Uploading voice message...',
      fileUrl: null,
      messageType: 'voice',
      timestamp: Timestamp.now(),
    };

    setOptimisticMessages(prev => [...prev, tempMessage]);

    try {
      await uploadAndAddMessage(projectId, audioBlob);
      toast({ title: 'Voice message sent' });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({ title: 'Upload Failed', description: 'Could not send voice message.', variant: 'destructive' });
    } finally {
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      setIsSendingVoice(false);
      setAudioBlob(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[60vh] flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {projectMessages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            const messageDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();

            const isOptimistic = 'message' in msg && msg.message.startsWith('Uploading');

            return (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className={`group flex items-start gap-3 rounded-md p-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {msg.senderName.charAt(0)}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                    <div className={`relative rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                       {msg.replyTo && (
                         <div 
                           className="p-2 mb-2 border-l-2 border-primary-foreground/50 bg-black/10 rounded-md cursor-pointer hover:bg-black/20"
                           onClick={() => handleScrollToMessage(msg.replyTo!.messageId)}
                           >
                            <p className="text-xs font-semibold">{msg.replyTo.senderName}</p>
                            <p className="text-xs opacity-80 truncate">{msg.replyTo.message}</p>
                         </div>
                       )}

                       {isOptimistic ? (
                         <div className="flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           <p className="text-sm">{msg.message}</p>
                         </div>
                       ) : msg.messageType === 'file' ? (
                           <a href={msg.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 hover:bg-accent">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                              <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{msg.message}</p>
                              </div>
                           </a>
                        ) : msg.messageType === 'voice' ? (
                          <audio controls src={msg.fileUrl!} className="max-w-full" />
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
                {isCurrentUser && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {msg.senderName.charAt(0)}
                    </div>
                )}
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
        {audioBlob ? (
          <div className="flex w-full items-center space-x-2">
             <Button variant="destructive" onClick={() => setAudioBlob(null)}>Cancel</Button>
             <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1"/>
             <Button onClick={sendVoiceMessage} size="icon" disabled={isSendingVoice}>
                {isSendingVoice ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
             </Button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                  <span className="sr-only">Attach file</span>
              </Button>
              
              <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoComplete="off"
              />
               {isRecording ? (
                  <Button type="button" size="icon" onClick={stopRecording} variant="destructive">
                      <StopCircle className="h-5 w-5" />
                  </Button>
              ) : (
                  <Button type="button" size="icon" onClick={startRecording}>
                      <Mic className="h-5 w-5" />
                  </Button>
              )}
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
              </Button>
          </form>
        )}
      </div>
    </div>
  );
}
