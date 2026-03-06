'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebaseServices } from '@/firebase';
import { doc, setDoc, onSnapshot, deleteField } from 'firebase/firestore';

interface TypingIndicatorProps {
  projectId: string;
  currentUserId: string;
  currentUserName: string;
}

export function TypingIndicator({ projectId, currentUserId, currentUserName }: TypingIndicatorProps) {
  const { firestore: db } = useFirebaseServices();
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!projectId || !db) return;

    // Listen to typing status
    const typingRef = doc(db, 'projects', projectId, 'typing-status', 'current');
    
    const unsubscribe = onSnapshot(typingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Filter out current user and expired statuses
        const now = Date.now();
        const active: { [key: string]: string } = {};
        
        Object.entries(data).forEach(([userId, info]: [string, any]) => {
          if (userId !== currentUserId && info?.timestamp) {
            const timestamp = info.timestamp?.toMillis ? info.timestamp.toMillis() : info.timestamp;
            if (now - timestamp < 5000) { // 5 seconds timeout
              active[userId] = info.name;
            }
          }
        });
        
        setTypingUsers(active);
      }
    }, (error) => {
      console.error('Error listening to typing status:', error);
    });

    return () => unsubscribe();
  }, [projectId, currentUserId, db]);

  const typingUserNames = Object.values(typingUsers);

  if (typingUserNames.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {typingUserNames.length === 1 
          ? `${typingUserNames[0]} is typing...`
          : typingUserNames.length === 2
          ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
          : `${typingUserNames.length} people are typing...`
        }
      </span>
    </div>
  );
}

// Hook to update typing status with debouncing
export function useTypingIndicator(projectId: string, userId: string, userName: string) {
  const { firestore: db } = useFirebaseServices();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateTyping = async (isTyping: boolean) => {
    if (!db || !projectId || !userId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Debounce: Only update if more than 1 second since last update
    const now = Date.now();
    if (isTyping && now - lastUpdateRef.current < 1000) {
      return;
    }

    try {
      const typingRef = doc(db, 'projects', projectId, 'typing-status', 'current');
      
      if (isTyping) {
        lastUpdateRef.current = now;
        
        // Set typing status
        await setDoc(typingRef, {
          [userId]: {
            name: userName,
            timestamp: now
          }
        }, { merge: true });

        // Auto-clear after 3 seconds
        typingTimeoutRef.current = setTimeout(async () => {
          try {
            await setDoc(typingRef, {
              [userId]: deleteField()
            }, { merge: true });
          } catch (error) {
            // Silently fail
          }
        }, 3000);
      } else {
        // Immediately clear typing status
        await setDoc(typingRef, {
          [userId]: deleteField()
        }, { merge: true });
      }
    } catch (error) {
      // Silently fail - typing indicator is not critical
      console.debug('Typing indicator update skipped');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { updateTyping };
}
