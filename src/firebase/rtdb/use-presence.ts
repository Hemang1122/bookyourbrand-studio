'use client';
import { useEffect } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { useFirebaseServices } from '@/firebase/provider';

export function usePresence(userId?: string) {
    const { database, auth } = useFirebaseServices();

    useEffect(() => {
        if (!database || !auth || !userId) {
            return;
        }

        const myConnectionsRef = ref(database, `users/${userId}/connections`);
        const lastOnlineRef = ref(database, `users/${userId}/lastOnline`);
        const presenceRef = ref(database, `.info/connected`);

        const unsubscribe = onValue(presenceRef, (snap) => {
            if (snap.val() === true) {
                const con = myConnectionsRef.push();
                onDisconnect(con).remove();
                set(con, true);
                onDisconnect(lastOnlineRef).set(serverTimestamp());
            }
        });

        return () => {
            unsubscribe();
        };

    }, [database, auth, userId]);
}
