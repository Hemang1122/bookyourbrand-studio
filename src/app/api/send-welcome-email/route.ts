import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const { name, email, username, password, userType } = body;

    if (!email || !username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (email, username, or password)' 
      }, { status: 400 });
    }

    // 2. Check environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      console.error('❌ GMAIL_USER or GMAIL_APP_PASSWORD not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Email service configuration missing on server' 
      }, { status: 500 });
    }

    console.log('📧 Sending welcome email to:', email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const loginUrl = 'https://bybcrm.bookyourbrands.com';
    const roleLabel = userType === 'team' ? 'Team Member' : 'Client';

    const emailFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 13px; margin: 10px 0;">
          <strong>💬 Need to discuss this?</strong><br>
          • For project-related discussions, use the <strong>Project Chat</strong> feature in your dashboard<br>
          • For general support, use our <strong>BYB Support</strong> feature<br>
          • Do not reply to this email - it's an automated notification
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px;">
          © ${new Date().getFullYear()} BookYourBrands. All rights reserved.
        </p>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #2d3748; background-color: #f7fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; }
          .credentials { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .label { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
          .value { font-family: monospace; background: #ffffff; padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; margin-bottom: 15px; }
          .cta { display: block; background: #667eea; color: white !important; text-decoration: none; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0">🎨 Welcome to BookYourBrands</h1>
            <p style="color:#718096">${roleLabel} Account Created</p>
          </div>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your BookYourBrands CRM account has been created. Use the credentials below to log in:</p>
          <div class="credentials">
            <div class="label">Portal URL</div>
            <div class="value">${loginUrl}</div>
            <div class="label">Username</div>
            <div class="value">${username}</div>
            <div class="label">Password</div>
            <div class="value">${password}</div>
          </div>
          <a href="${loginUrl}" class="cta">Access Your Dashboard →</a>
          <p style="font-size: 13px; color: #718096;">⚠️ Please change your password after your first login.</p>
          ${emailFooter}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"BookYourBrands" <${gmailUser}>`,
      to: email,
      subject: `🎨 Welcome to BookYourBrands - Your ${roleLabel} Account`,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
