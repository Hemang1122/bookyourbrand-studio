
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppLayoutClient from './layout-client';
import { FirebaseClientProvider } from '@/firebase';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <FirebaseClientProvider>
      <AppLayoutClient user={user}>{children}</AppLayoutClient>
    </FirebaseClientProvider>
  );
}
