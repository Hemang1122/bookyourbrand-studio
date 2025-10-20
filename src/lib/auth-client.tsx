'use client';

// This file is obsolete and its functionality has been integrated into the Firebase Provider.
// It is kept for now to prevent breaking imports, but should be removed in the future.
import { useAuth as useAppAuth } from '@/firebase/provider';

// The useAuth hook is now a proxy to the more comprehensive useUser hook from the Firebase provider.
export function useAuth() {
  // This now correctly pulls the fully-formed User object and loading state
  // from the AuthProvider context, which is set in the main app layout.
  return useAppAuth();
}
