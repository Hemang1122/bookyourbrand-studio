import { NextResponse } from 'next/server';

/**
 * @fileOverview Background Email Dispatcher Route (Deprecated/Placeholder)
 * This route is currently disabled to resolve build errors related to static analysis.
 */

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Cron listener is currently disabled.' 
  });
}
