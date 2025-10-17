import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppLayoutClient from './layout-client';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return <AppLayoutClient user={user}>{children}</AppLayoutClient>;
}
