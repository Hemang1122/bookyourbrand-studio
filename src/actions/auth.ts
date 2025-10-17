'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { users } from '@/lib/data';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  // In a real app, you'd validate credentials against a database with hashed passwords.
  // Here, we just find a user with matching username and password.
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    cookies().set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  } else {
    // Handle case where credentials are wrong
    redirect('/login?error=Invalid_credentials');
  }
}

export async function logout() {
  cookies().delete('user_id');
  redirect('/login');
}
