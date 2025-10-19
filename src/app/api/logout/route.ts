
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, response: NextResponse) {
  //Add the cookie to the browser
  cookies().delete('session');

  return NextResponse.json({}, { status: 200 });
}
