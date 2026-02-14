'use client';
// This component is no longer used by the new Firestore-based notification system.
// It can be safely removed.
import { ReactNode } from 'react';

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
