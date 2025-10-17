import 'server-only';
import { cookies } from 'next/headers';
import type { User, UserRole } from './types';
import { users } from './data';

export async function getUser(): Promise<User | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return null;
  }

  const user = users.find((u) => u.id === userId);
  return user || null;
}

export async function getUserRole(): Promise<UserRole | null> {
    const user = await getUser();
    return user?.role || null;
}
