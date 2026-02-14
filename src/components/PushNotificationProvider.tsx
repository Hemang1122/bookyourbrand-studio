'use client';
import { useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { firestore, firebaseApp } = useFirebaseServices();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !firebaseApp || !user || !firestore) {
      return;
    }

    const messaging = getMessaging(firebaseApp);

    // 1. Request Permission
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');

        // IMPORTANT: You need to generate this VAPID key in your Firebase project settings
        // (Project Settings > Cloud Messaging > Web configuration) and add it to your 
        // environment variables as NEXT_PUBLIC_FCM_VAPID_KEY
        const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;

        if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE') {
            console.error("FCM VAPID key is not configured. Push notifications will not work.");
            if (process.env.NODE_ENV === 'development') {
                 toast({
                    title: "FCM Not Configured",
                    description: "Add NEXT_PUBLIC_FCM_VAPID_KEY to your .env file to enable push notifications.",
                    variant: 'destructive',
                    duration: 10000,
                });
            }
            return;
        }

        // 2. Get Token
        getToken(messaging, { vapidKey: vapidKey })
          .then((currentToken) => {
            if (currentToken) {
              // 3. Save Token to Firestore
              if (!user.fcmTokens?.includes(currentToken)) {
                const userRef = doc(firestore, 'users', user.id);
                updateDoc(userRef, {
                  fcmTokens: arrayUnion(currentToken),
                });
              }
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          })
          .catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
          });
      } else {
        console.log('Unable to get permission to notify.');
      }
    });

    // 4. Handle Foreground Messages
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, [user, firestore, firebaseApp, toast]);

  return <>{children}</>;
}
