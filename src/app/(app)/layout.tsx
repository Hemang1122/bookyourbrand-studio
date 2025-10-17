
import AppLayoutClient from './layout-client';
import { getUser } from '@/lib/auth';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The old server-side check is removed.
  // The new AppLayoutClient will handle auth state and redirects.
  const user = await getUser();

  return (
      <AppLayoutClient initialUser={user}>{children}</AppLayoutClient>
  );
}
