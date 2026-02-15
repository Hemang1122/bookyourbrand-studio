'use client';
import { useEffect } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp, push } from 'firebase/database';
import { useFirebaseServices } from '@/firebase/provider';

export function usePresence(userId?: string) {
    const { database } = useFirebaseServices();

    useEffect(() => {
        if (!database || !userId) {
            return;
        }

        const userStatusDatabaseRef = ref(database, `status/${userId}`);
        const userConnectionsDatabaseRef = ref(database, `users/${userId}/connections`);
        const presenceRef = ref(database, '.info/connected');

        let unsubscribe = onValue(presenceRef, (snap) => {
            if (snap.val() === false) {
                return;
            }

            const con = push(userConnectionsDatabaseRef);
            onDisconnect(con).remove();

            set(con, true);
            
            onDisconnect(userStatusDatabaseRef).set({
                isOnline: false,
                last_seen: serverTimestamp(),
            });
            
            set(userStatusDatabaseRef, {
                isOnline: true,
                last_seen: serverTimestamp(),
            });
        });

        return () => {
            unsubscribe();
        };
    }, [database, userId]);
}
