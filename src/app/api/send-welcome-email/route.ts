import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-service';

/**
 * API route to send welcome emails to newly created clients.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    const loginUrl = 'https://bybcrm.bookyourbrands.com/login';
    
    console.log(`📧 Sending welcome email to ${email}`);

    const result = await sendWelcomeEmail({
      to: email,
      name,
      email,
      password,
      loginUrl
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Email Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
