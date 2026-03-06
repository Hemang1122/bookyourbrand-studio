import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Backup API Route for welcome emails.
 * Prefer using sendWelcomeEmailAction for type-safety.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"BookYourBrands CRM" <${user}>`,
      to: email,
      subject: '🎉 Welcome to BookYourBrands CRM',
      text: `Welcome ${name}! Your account is ready.\n\nLogin: https://bybcrm.bookyourbrands.com\nEmail: ${email}\nPassword: ${password}`,
      html: `<h1>Welcome ${name}!</h1><p>Your credentials are: <br/>Email: ${email}<br/>Password: ${password}</p>`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Email Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
