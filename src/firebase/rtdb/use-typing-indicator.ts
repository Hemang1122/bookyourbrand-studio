'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { useFirebaseServices } from '@/firebase/provider';
import { useAuth } from '@/firebase/provider';

const TYPING_TIMEOUT = 5000; // 5 seconds

export function useTypingIndicator(chatId: string | null) {
  const { database } = useFirebaseServices();
  const { user: currentUser } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for typing users in the current chat
  useEffect(() => {
    if (!database || !chatId) {
        setTypingUsers([]);
        return;
    };

    const typingRef = ref(database, `typing/${chatId}`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const typingIds = Object.keys(data).filter(
          (userId) => data[userId] === true && userId !== currentUser?.id
        );
        setTypingUsers(typingIds);
      } else {
        setTypingUsers([]);
      }
    });

    return () => {
        unsubscribe();
    };
  }, [database, chatId, currentUser?.id]);


  // Function for the current user to indicate they are typing
  const setTyping = useCallback((isTyping: boolean) => {
    if (!database || !chatId || !currentUser) return;
    
    const userTypingRef = ref(database, `typing/${chatId}/${currentUser.id}`);

    if (isTyping) {
      set(userTypingRef, true);
      
      onDisconnect(userTypingRef).remove();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        set(userTypingRef, null);
      }, TYPING_TIMEOUT);

    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      set(userTypingRef, null);
    }
  }, [database, chatId, currentUser]);
  
  useEffect(() => {
    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }
  }, []);

  return { typingUsers, setTyping };
}
