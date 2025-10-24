'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, FileText, Mic, Square, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../../data-provider';
import { AddChatAttachmentDialog } from './add-chat-attachment-dialog';
import { Timestamp } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

type ChatRoomProps = {
  projectId: string;
};

export function ChatRoom({ projectId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { messages, addMessage, users } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

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
          // Clean up the stream tracks
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          toast({ title: "Recording Stopped" });
      }
  };
  
  const sendVoiceMessage = async () => {
    if (!audioBlob || !currentUser) return;
    try {
        toast({ title: "Uploading...", description: "Your voice message is being sent." });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        const downloadURL = await uploadFile(audioFile, `voice-messages/${projectId}`);
        
        addMessage({
            projectId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            message: "Voice Message",
            fileUrl: downloadURL,
            messageType: 'voice',
        });

        setAudioBlob(null); // Clear the blob after sending
    } catch (error) {
        toast({ title: "Upload Failed", description: "Could not send the voice message.", variant: 'destructive'});
        console.error("Failed to upload voice message:", error);
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
                <Button onClick={sendVoiceMessage} size="icon">
                    <Send className="h-5 w-5" />
                </Button>
                <Button onClick={() => setAudioBlob(null)} size="icon" variant="destructive">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
        ) : (
            <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
            <AddChatAttachmentDialog onAddAttachment={handleAddAttachment}>
                <Button variant="ghost" size="icon" type="button" disabled={isRecording}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
            </AddChatAttachmentDialog>

            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                autoComplete="off"
                disabled={isRecording}
            />

            {isRecording ? (
                 <Button type="button" size="icon" onClick={stopRecording} variant="destructive">
                    <Square className="h-5 w-5" />
                    <span className="sr-only">Stop Recording</span>
                </Button>
            ) : (
                <Button type="button" size="icon" onClick={startRecording}>
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Record Voice Message</span>
                </Button>
            )}

            <Button type="submit" size="icon" disabled={!newMessage.trim() || isRecording}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
            </Button>
            </form>
        )}
      </div>
    </div>
  );
}
