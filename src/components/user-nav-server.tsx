import { getUser } from '@/lib/auth';
import { UserNavClient } from './user-nav-client';

export async function UserNavServer() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return <UserNavClient user={user} />;
}
