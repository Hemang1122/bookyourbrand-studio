import { NextRequest, NextResponse } from 'next/server';
import { startNotificationEmailListener } from '@/lib/notification-email-sender';

/**
 * @fileOverview Background Email Dispatcher Route
 * This endpoint initializes the real-time notification listener.
 * In a serverless environment, this should be triggered periodically via a cron job.
 */

export async function GET(request: NextRequest) {
  try {
    // Start the real-time listener
    startNotificationEmailListener();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification email listener successfully initialized.' 
    });
  } catch (error: any) {
    console.error('Failed to start email listener:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
