'use client';
import { useEffect, useRef } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { useFirebaseServices } from '@/firebase/provider';

export function usePresence(userId?: string) {
    const { database } = useFirebaseServices();
    const userIdRef = useRef(userId);
    
    // Keep ref in sync so cleanup always has latest userId
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        if (!database || !userId) {
            // If userId just became undefined (logout), force offline immediately
            // using the ref which still has the old userId
            if (!userId && userIdRef.current && database) {
                const offlineRef = ref(database, `status/${userIdRef.current}`);
                set(offlineRef, {
                    isOnline: false,
                    last_seen: serverTimestamp(),
                });
            }
            return;
        }

        const userStatusRef = ref(database, `status/${userId}`);
        const connectedRef = ref(database, '.info/connected');

        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === false) {
                set(userStatusRef, {
                    isOnline: false,
                    last_seen: serverTimestamp(),
                });
                return;
            }

            // Register onDisconnect FIRST, then set online
            onDisconnect(userStatusRef)
                .set({
                    isOnline: false,
                    last_seen: serverTimestamp(),
                })
                .then(() => {
                    set(userStatusRef, {
                        isOnline: true,
                        last_seen: serverTimestamp(),
                    });
                });
        });

        // Explicit cleanup on unmount/logout
        return () => {
            unsubscribe();
            // Cancel the onDisconnect handler and set offline explicitly
            onDisconnect(userStatusRef).cancel();
            set(userStatusRef, {
                isOnline: false,
                last_seen: serverTimestamp(),
            });
        };
    }, [database, userId]);
}