'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The FirebaseProvider now handles its own initialization logic,
  // so this component is simpler.
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
