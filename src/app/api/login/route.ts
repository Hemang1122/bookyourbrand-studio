
// This file is no longer used for session management and can be safely removed.
// The new authentication flow relies on the Firebase client-side SDK's persistence.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 410 });
}
