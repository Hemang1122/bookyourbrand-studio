'use client';

import { useState, useEffect } from 'react';
import { useFirebaseServices } from '@/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface TypingIndicatorProps {
  projectId: string;
  currentUserId: string;
}

export function TypingIndicator({ projectId, currentUserId }: TypingIndicatorProps) {
  const { firestore: db } = useFirebaseServices();
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: { name: string; timestamp: any; isRecording: boolean } }>({});

  useEffect(() => {
    if (!db || !projectId) return;

    const typingRef = doc(db, 'projects', projectId, 'status', 'current');
    
    const unsubscribe = onSnapshot(typingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = Date.now();
        const active: { [key: string]: any } = {};
        
        Object.entries(data).forEach(([userId, info]: [string, any]) => {
          if (userId !== currentUserId && info.timestamp) {
            const timestamp = info.timestamp.toMillis ? info.timestamp.toMillis() : info.timestamp;
            if (now - timestamp < 4000) { // 4 seconds timeout
              active[userId] = info;
            }
          }
        });
        
        setTypingUsers(active);
      } else {
        setTypingUsers({});
      }
    });

    return () => unsubscribe();
  }, [db, projectId, currentUserId]);

  const activeEntries = Object.values(typingUsers);
  if (activeEntries.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-4 py-2 bg-[#13131F]/50 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeEntries.map((info, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex gap-1 shrink-0">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", info.isRecording ? "bg-red-500" : "bg-primary")} style={{ animationDelay: '0ms' }} />
            <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", info.isRecording ? "bg-red-500" : "bg-primary")} style={{ animationDelay: '150ms' }} />
            <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce", info.isRecording ? "bg-red-500" : "bg-primary")} style={{ animationDelay: '300ms' }} />
          </div>
          <span className="truncate">
            <strong>{info.name}</strong> {info.isRecording ? 'is recording a voice note...' : 'is typing...'}
          </span>
        </div>
      ))}
    </div>
  );
}

import { cn } from '@/lib/utils';

export function useChatStatus(projectId: string, userId: string, userName: string) {
  const { firestore: db } = useFirebaseServices();

  const updateStatus = async (isTyping: boolean, isRecording: boolean = false) => {
    if (!db || !projectId || !userId) return;

    try {
      const statusRef = doc(db, 'projects', projectId, 'status', 'current');
      
      // Use setDoc with merge to update only this user's field
      await setDoc(statusRef, {
        [userId]: {
          name: userName,
          isTyping,
          isRecording,
          timestamp: serverTimestamp()
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error updating chat status:', error);
    }
  };

  return { updateStatus };
}
