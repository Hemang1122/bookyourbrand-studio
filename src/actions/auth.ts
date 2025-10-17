'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { users } from '@/lib/data';

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

export async function logout() {
  cookies().delete('user_id');
  redirect('/login');
}
