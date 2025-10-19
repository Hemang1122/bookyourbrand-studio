
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This is a simplified session handling mechanism.
// In a production app, you would verify the ID token with Firebase Admin SDK on a secure backend.

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    
    // In a real app, you would verify the idToken here using Firebase Admin SDK.
    // Since we can't use the Admin SDK in the Edge runtime, we will just set the cookie for now.
    // This is NOT secure for production, but it will make the login flow work in this environment.
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const options = {
      name: 'session',
      value: idToken, // We are using the ID token as the session cookie value for simplicity
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    //Add the cookie to the browser
    cookies().set(options);
    
    // Send a success response back to the client
    return NextResponse.json({ status: 'success' }, { status: 200 });
  }

  // If no authorization header or other issue, return an error
  return NextResponse.json({ status: 'error', message: 'Bad request.' }, { status: 400 });
}
