'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText, Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

type ChatRoomProps = {
  projectId: string;
};

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { messages: serverMessages, addMessage, uploadAndAddMessage } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);


  const projectMessages = useMemo(() => {
    if (!serverMessages) return optimisticMessages;
    const combined = [...serverMessages.filter(m => m.projectId === projectId), ...optimisticMessages];
    const uniqueMessages = Array.from(new Map(combined.map(m => [m.id, m])).values());
    return uniqueMessages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
  }, [serverMessages, projectId, optimisticMessages]);


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
        messageType: 'text',
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
        messageType: 'file'
    });
  }

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);

        const audioChunks: Blob[] = [];
        mediaRecorderRef.current.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            setAudioBlob(audioBlob);
        };
        
        toast({ title: "Recording Started", description: "The microphone is now active." });

    } catch (err) {
        toast({ title: "Microphone Error", description: "Could not access the microphone. Please check permissions.", variant: 'destructive'});
        console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          toast({ title: "Recording Stopped" });
      }
  };
  
const sendVoiceMessage = async () => {
  if (!audioBlob || !currentUser) return;

  const tempId = uuidv4();
  const tempMessage: ChatMessage = {
    id: tempId,
    projectId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderAvatar: currentUser.avatar || '',
    message: "Uploading voice message...",
    fileUrl: null, // No file URL for optimistic message
    messageType: 'voice',
    timestamp: Timestamp.now(),
  };

  setOptimisticMessages(prev => [...prev, tempMessage]);
  setAudioBlob(null);
  setIsSendingVoice(true);

  try {
    // This function now handles the upload and adds the message to Firestore.
    await uploadAndAddMessage(projectId, audioBlob);
    
    toast({ title: "Voice message sent" });

  } catch (error) {
    console.error("Error sending voice message:", error);
    toast({
      title: "Upload Failed",
      description: "Could not send your voice message.",
      variant: "destructive",
    });
  } finally {
    // Remove the optimistic message once the real one is added by the listener
    setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
    setIsSendingVoice(false);
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
            const isOptimistic = 'id' in msg && optimisticMessages.some(om => om.id === msg.id);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                    <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.messageType === 'voice' && msg.fileUrl ? (
                            <audio controls src={msg.fileUrl} className="max-w-full" />
                        ) : isOptimistic ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span>{msg.message}</span>
                            </div>
                        ) : msg.fileUrl ? (
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
        {audioBlob && !isRecording ? (
            <div className="flex w-full items-center space-x-2">
                <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                <Button onClick={sendVoiceMessage} size="icon" disabled={isSendingVoice}>
                    {isSendingVoice ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                <Button onClick={() => setAudioBlob(null)} size="icon" variant="destructive" disabled={isSendingVoice}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
        ) : (
            <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
            <AddChatAttachmentDialog onAddAttachment={handleAddAttachment}>
                <Button variant="ghost" size="icon" type="button" disabled={isRecording || isSendingVoice}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
            </AddChatAttachmentDialog>

            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? "Recording audio..." : isSendingVoice ? "Sending voice message..." : "Type a message..."}
                autoComplete="off"
                disabled={isRecording || isSendingVoice}
            />

            {isRecording ? (
                 <Button type="button" size="icon" onClick={stopRecording} variant="destructive">
                    <Square className="h-5 w-5" />
                    <span className="sr-only">Stop Recording</span>
                </Button>
            ) : (
                <Button type="button" size="icon" onClick={startRecording} disabled={isSendingVoice}>
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Record Voice Message</span>
                </Button>
            )}

            <Button type="submit" size="icon" disabled={!newMessage.trim() || isRecording || isSendingVoice}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
            </Button>
            </form>
        )}
      </div>
    </div>
  );
}
