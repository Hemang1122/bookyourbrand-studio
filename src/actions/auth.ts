'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { users } from '@/lib/data';

// This function is no longer needed for login, as we are using Firebase Auth.
// It can be removed or kept for other potential form actions.
// For now, we will leave the file but the login function is deprecated.
export async function login(formData: FormData) {
  const userId = formData.get('user_id') as string;

  if (userId) {
    cookies().set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  } else {
    // Handle case where credentials are wrong
    redirect('/login?error=Invalid_user');
  }
}

// This server action is no longer used for logout.
// We are now using client-side Firebase signOut.
export async function logout() {
  cookies().delete('user_id');
  redirect('/login');
}
