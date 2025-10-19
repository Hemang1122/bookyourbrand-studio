
'use client';
import { users } from '@/lib/data';
import AppLayoutClient from './layout-client';

// This is a mock authentication guard.
// In a real app, you would use a proper authentication solution.
const MOCK_USER_ID = 'user-1'; // Simulating 'Alex Johnson' (admin) is logged in.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = users.find((u) => u.id === MOCK_USER_ID);

  if (!user) {
    // This should not happen with mock data but is good practice.
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return <AppLayoutClient user={user}>{children}</AppLayoutClient>;
}
