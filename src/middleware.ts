
import { type NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/firebase/admin';
import { auth } from 'firebase-admin';

// Initialize the Firebase Admin SDK
getFirebaseAdminApp();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of paths that do not require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password'];

  // If the requested path is a public one, let it through.
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // If it's an API route, let it be handled by its own logic (e.g., /api/login, /api/logout)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // If no session cookie, redirect to login, preserving the originally requested URL
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify the session cookie. This checks if the token is valid and not expired.
    await auth().verifySessionCookie(sessionCookie, true);
    
    // If verification is successful, allow the request to proceed.
    return NextResponse.next();

  } catch (error) {
    console.error('Session cookie verification failed:', error);
    // If verification fails (e.g., cookie expired), redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  // Matcher to define which paths the middleware should run on.
  // This excludes static files and internal Next.js assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/login|api/logout).*)',
  ],
};
