
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of paths that do not require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password'];

  // If the requested path is a public one, let it through.
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // If it's an API route, let it be handled by its own logic
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

  // If the session cookie exists, allow the request to proceed.
  // The actual validation of the cookie against a session store or service
  // would happen in a server component or API route that needs protected data.
  return NextResponse.next();
}

export const config = {
  // Matcher to define which paths the middleware should run on.
  // This excludes static files and internal Next.js assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/login|api/logout).*)',
  ],
};
