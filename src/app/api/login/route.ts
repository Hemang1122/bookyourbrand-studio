
import { auth } from 'firebase-admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/firebase/admin';

// It is important that we initialize the app once!
getFirebaseAdminApp();

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await auth().verifyIdToken(idToken);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth().createSessionCookie(idToken, {
          expiresIn,
        });
        const options = {
          name: 'session',
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: true,
        };

        //Add the cookie to the browser
        cookies().set(options);
        // Send a success response back to the client
        return NextResponse.json({ status: 'success' }, { status: 200 });
      }
    } catch (error) {
      console.error('Error verifying ID token or creating session cookie:', error);
      return NextResponse.json({ status: 'error', message: 'Authentication failed.' }, { status: 401 });
    }
  }
  // If no authorization header or other issue, return an error
  return NextResponse.json({ status: 'error', message: 'Bad request.' }, { status: 400 });
}
