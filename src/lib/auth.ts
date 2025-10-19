
import 'server-only';
import { cookies } from 'next/headers';
import type { User, UserRole } from './types';
import { users } from './data';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/firebase/admin';


/**
 * Retrieves the application-specific user profile based on the currently
 * authenticated Firebase user.
 *
 * This function is intended for use in Server Components. It validates the
 * session cookie, gets the corresponding Firebase user, and then finds the
 * matching user profile from the local data source (`lib/data.ts`).
 *
 * @returns {Promise<User | null>} A promise that resolves to the app-specific
 * user object or null if the user is not authenticated or not found.
 */
export async function getUser(): Promise<User | null> {
  const session = cookies().get('session')?.value || '';

  // If no session cookie is present, the user is not authenticated.
  if (!session) {
    return null;
  }

  const adminApp = getFirebaseAdminApp();
  const auth = getAuth(adminApp);

  try {
    // Verify the session cookie and decode the user's token.
    const decodedIdToken = await auth.verifySessionCookie(session, true);
    const firebaseUser = await auth.getUser(decodedIdToken.uid);

    if (!firebaseUser.email) {
      return null;
    }

    // Find the corresponding user in the local data array.
    // In a real application, this might involve a database query.
    const appUser = users.find((u) => u.email === firebaseUser.email);
    
    return appUser || null;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

export async function getUserRole(): Promise<UserRole | null> {
    const user = await getUser();
    return user?.role || null;
}
