'use client';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, FileText, Download, Loader2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase/provider';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirebaseServices, useMemoFirebase, useTypingIndicator } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, writeBatch, arrayUnion, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../data-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { UserPresence } from '@/components/ui/user-presence';
import { TypingIndicator } from './TypingIndicator';

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
    // Double blue ticks
    return (
      <span className="inline-flex items-center ml-1">
        <svg width="16" height="10" viewBox="0 0 16 10" 
             className="text-blue-500" fill="currentColor">
          <path d="M1 5l3 3L10 1M6 5l3 3 5-7" 
                stroke="currentColor" strokeWidth="1.5" 
                fill="none" strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  if (isDelivered) {
    // Double grey ticks
    return (
      <span className="inline-flex items-center ml-1 
                       text-muted-foreground">
        <svg width="16" height="10" viewBox="0 0 16 10"
             fill="none" stroke="currentColor" 
             strokeWidth="1.5" strokeLinecap="round" 
             strokeLinejoin="round">
          <path d="M1 5l3 3L10 1M6 5l3 3 5-7"/>
        </svg>
      </span>
    );
  }

  // Single grey tick — sent
  return (
    <span className="inline-flex items-center ml-1 
                     text-muted-foreground">
      <svg width="10" height="10" viewBox="0 0 10 10"
           fill="none" stroke="currentColor" 
           strokeWidth="1.5" strokeLinecap="round" 
           strokeLinejoin="round">
        <path d="M1 5l3 3 5-7"/>
      </svg>
    </span>
  );
};


type SupportChatRoomProps = {
  chatPartner: User;
};

export function SupportChatRoom({ chatPartner }: SupportChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user: currentUser } = useAuth();
  const { firestore, firebaseApp, auth } = useFirebaseServices();
  const { getOrCreateChat, sendMessage, markChatNotificationsAsRead } = useData();
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { typingUsers, setTyping } = useTypingIndicator(chatId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTaskRef = useRef<any>(null);
  const { toast } = useToast();

  // Get or create chat ID
  useEffect(() => {
    if (currentUser && chatPartner) {
        getOrCreateChat(chatPartner.id).then(setChatId);
    }
  }, [currentUser, chatPartner, getOrCreateChat]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  // Mark messages as read when the chat room is opened or new messages arrive
  useEffect(() => {
    if (!chatId || !firestore || !currentUser || !messages || messages.length === 0) return;
    const authUid = auth?.currentUser?.uid ?? currentUser.id;

    const unreadMessages = messages.filter(msg => 
        msg.senderId !== currentUser.id && !(msg.readBy || []).includes(authUid)
    );

    if (unreadMessages.length > 0) {
        const batch = writeBatch(firestore);
        unreadMessages.forEach(msg => {
            const msgRef = doc(firestore, 'chats', chatId, 'messages', msg.id);
            batch.update(msgRef, {
                readBy: arrayUnion(authUid)
            });
        });

        batch.commit().catch(err => console.error("Failed to mark messages as read:", err));
    }
     
    // Also mark related notifications as read
    markChatNotificationsAsRead(chatId);

  }, [messages, chatId, firestore, currentUser, auth, markChatNotificationsAsRead]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    if ((messages?.length || 0) > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId || !firestore) return;
    
    const confirmed = window.confirm(
      'Delete this message? This cannot be undone.'
    );
    if (!confirmed) return;
    
    const msgRef = doc(
      firestore, 
      'chats', chatId, 'messages', messageId
    );
    
    await updateDoc(msgRef, {
      deleted: true,
      text: 'This message was deleted',
      mediaURL: null,
    });
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim()) return;
    sendMessage(chatId, newMessage);
    setTyping(false);
    setNewMessage('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!chatId) return;
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
          sendMessage(chatId, file.name, downloadURL);
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


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(true);
  }
  
  if (!currentUser || !chatPartner) return null;

  const partnerAvatar = PlaceHolderImages.find(p => p.id === chatPartner.avatar);

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex-row items-center border-b">
         <Avatar>
            <AvatarImage src={partnerAvatar?.imageUrl} alt={chatPartner.name} />
            <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
        </Avatar>
         <div className="ml-4">
            <CardTitle className="text-base">{chatPartner.name}</CardTitle>
            <UserPresence userId={chatPartner.id} />
         </div>
      </CardHeader>
      {currentUser.role === 'client' && (
        <div className="p-3 text-center border-b bg-muted/50">
          <p className="font-signature text-lg font-bold text-primary/90">
            BookYourBrands support team will respond within 10 mins max.
          </p>
        </div>
      )}
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
                No messages yet. Send a message to start the conversation!
                </div>
            )}
            {!messagesLoading &&
                messages?.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.id;
                const timestamp = msg.timestamp as Timestamp;
                const messageDate = timestamp?.toDate() || new Date();

                return (
                    <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                        isCurrentUser ? 'justify-end' : 'justify-start'
                    }`}
                    >
                      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${ isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {!isCurrentUser && ( <span className="text-xs text-muted-foreground">{msg.senderName}</span> )}
                        <div className="group relative">
                          <div className={`rounded-lg px-4 py-2 ${ isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.deleted ? (
                              <p className="text-sm italic text-muted-foreground/70">
                                🚫 This message was deleted
                              </p>
                            ) : msg.mediaURL && msg.mediaURL.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
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
                          {isCurrentUser && !msg.deleted && (
                            <button
                              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className={`text-xs mt-1 flex items-center gap-0.5 ${ isCurrentUser ? 'justify-end' : 'justify-start'} text-muted-foreground/80`}>
                          {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isCurrentUser && (
                            <MessageTicks 
                              msg={msg} 
                              currentUserId={currentUser.id}
                              partnerId={chatPartner.id}
                            />
                          )}
                        </p>
                      </div>
                    </div>
                );
                })}
            </div>
        </ScrollArea>
        <TypingIndicator typingUserIds={typingUsers} />
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
            <form
            onSubmit={handleSendTextMessage}
            className="flex w-full items-center space-x-2"
            >
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
                onChange={handleInputChange}
                placeholder="Type a message..."
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
