'use client';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { useFirebaseServices } from '@/firebase/provider';
import type { UserPresence } from '@/lib/types';

export function useUserStatus(userId: string): UserPresence | null {
  const { database } = useFirebaseServices();
  const [userStatus, setUserStatus] = useState<UserPresence | null>(null);

  useEffect(() => {
    if (!database || !userId) {
      return;
    }

    const userStatusRef = ref(database, `/status/${userId}`);
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const status = snapshot.val();
      setUserStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, [database, userId]);

  return userStatus;
}
