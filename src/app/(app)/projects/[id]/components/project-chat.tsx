'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, User, Project } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Loader2, FileText, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebaseServices, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../../data-provider';
import { useToast } from '@/hooks/use-toast';

type ProjectChatProps = {
  project: Project;
};

export function ProjectChat({ project }: ProjectChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore, firebaseApp } = useFirebaseServices();
  const { addNotification, markChatNotificationsAsRead } = useData();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTaskRef = useRef<any>(null);
  const { toast } = useToast();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects', project.id, 'chat', 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, project.id]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
    // Mark project chat notifications as read when component mounts
    if (project.id) {
        markChatNotificationsAsRead(project.id);
    }
  }, [project.id, markChatNotificationsAsRead]);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if ((messages?.length || 0) > 0) {
      scrollToBottom();
    }
  }, [messages]);


  const sendMessage = async (messageText: string, mediaUrl?: string) => {
     if (!currentUser || !firestore || (!messageText.trim() && !mediaUrl)) return;
     
     const messageType = mediaUrl ? 'media' : 'text';

     const messagesColRef = collection(firestore, 'projects', project.id, 'chat', 'messages');

     const messagePayload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: messageText,
      type: messageType,
      mediaURL: mediaUrl || null,
      timestamp: serverTimestamp(),
      readBy: [currentUser.id]
    };
    
    addDoc(messagesColRef, messagePayload);

    const recipients = [
        ...(project.team_ids || []),
        project.client.id
    ].filter(id => id !== currentUser.id);

    if (recipients.length > 0) {
        addNotification(
            `New message from ${currentUser.name} in project '${project.name}'`,
            `/projects/${project.id}?tab=chat`,
            recipients,
            'chat',
            project.id
        );
    }
    
    setNewMessage('');
  }

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage(firebaseApp);
      const timestamp = Date.now();
      const fileStorageRef = storageRef(storage, `chat-uploads/${project.id}/${timestamp}_${file.name}`);
      const task = uploadBytesResumable(fileStorageRef, file);
      uploadTaskRef.current = task;


      task.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Storage upload error code:', error.code);
          console.error('Storage upload error message:', error.message);
          console.error('Storage upload error details:', error);
          toast({ title: 'Upload Failed', description: `${error.code}: ${error.message}`, variant: 'destructive' });
          setIsUploading(false);
          setUploadProgress(0);
          uploadTaskRef.current = null;
        },
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          sendMessage(file.name, downloadURL);
          setIsUploading(false);
          setUploadProgress(0);
          uploadTaskRef.current = null;
        }
      );
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };
  
  if (!currentUser) return null;

  return (
    <div className="flex h-full flex-col">
       <CardHeader className="flex-row items-center border-b">
         <div className="ml-4">
            <CardTitle className="text-base">Project Chat</CardTitle>
            <CardDescription className="text-xs">Discussion for: {project.name}</CardDescription>
         </div>
      </CardHeader>
       <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
            {messagesLoading && (
                <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-12 w-1/2" />
                </div>
            )}
            {!messagesLoading && messages?.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                No messages in this project yet. Start the conversation!
                </div>
            )}
            {!messagesLoading && messages?.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.id;
                const timestamp = msg.timestamp as Timestamp;
                const messageDate = timestamp ? timestamp.toDate() : new Date();

                return (
                <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {!isCurrentUser && <span className="text-xs text-muted-foreground">{msg.senderName}</span>}
                        <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.mediaURL && msg.mediaURL.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                              <div className="space-y-2">
                                <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={msg.mediaURL} 
                                    alt={msg.text || 'Image attachment'} 
                                    className="max-w-[240px] max-h-[320px] rounded-lg object-cover cursor-pointer"
                                  />
                                </a>
                                {msg.text && !msg.mediaURL.includes(msg.text) && <p className="text-sm">{msg.text}</p>}
                              </div>
                            ) : msg.mediaURL ? (
                              <a href={msg.mediaURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background text-sm font-medium">
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate max-w-[180px]">{msg.text || 'Download file'}</span>
                                <Download className="h-4 w-4 shrink-0 ml-auto" />
                              </a>
                            ) : (
                                <p className="text-sm">{msg.text}</p>
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
         {isUploading && (
          <div className="px-4 py-1 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading... {uploadProgress}%</span>
              <div className="flex-1 bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
                onClick={() => {
                  uploadTaskRef.current?.cancel();
                  setIsUploading(false);
                  setUploadProgress(0);
                  uploadTaskRef.current = null;
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        <div className="border-t p-4 bg-background">
            <form onSubmit={handleSendTextMessage} className="flex w-full items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading 
                ? <Loader2 className="h-5 w-5 animate-spin" /> 
                : <Paperclip className="h-5 w-5" />
              }
               <span className="sr-only">Attach file</span>
            </Button>
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message for the project team..."
                autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
            </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
