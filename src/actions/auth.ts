'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { users } from '@/lib/data';

export async function login(formData: FormData) {
  const role = formData.get('role') as string;
  
  // In a real app, you'd validate credentials. Here, we just find the first user with the selected role.
  const user = users.find(u => u.role === role);

  if (user) {
    cookies().set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  } else {
    // Handle case where no user for the role is found
    redirect('/login?error=Invalid_role');
  }
}

export async function logout() {
  cookies().delete('user_id');
  redirect('/login');
}
