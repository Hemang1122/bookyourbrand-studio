import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const emailFooter = `
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="color: #666; font-size: 13px; margin: 10px 0;">
      <strong>💬 Need to discuss this?</strong><br>
      • For project-related discussions, use the <strong>Project Chat</strong> feature in your dashboard<br>
      • For general support, use our <strong>BYB Support</strong> feature<br>
      • Do not reply to this email - it's an automated notification
    </p>
    <p style="color: #999; font-size: 11px; margin-top: 20px;">
      © ${new Date().getFullYear()} BookYourBrands. All rights reserved.<br>
      This is an automated notification. Please do not reply to this email.
    </p>
  </div>
`;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    console.log('📧 Sending welcome email to:', email);

    const loginUrl = 'https://bybcrm.bookyourbrands.com';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { background: #ffffff; padding: 30px 20px; }
          .credentials { background: #f8f9ff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎨 Welcome to BookYourBrands!</h1>
          </div>
          <div class="content">
            <h2 style="color: #667eea;">Hello ${name}! 👋</h2>
            <p>Your BookYourBrands CRM account has been created successfully. We're excited to have you on board!</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0; color: #667eea;">📝 Your Login Credentials</h3>
              <p><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${password}</code></p>
            </div>

            <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px;">
              <strong>⚠️ Important:</strong> Please change your password after your first login for security.
            </p>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Your Dashboard →</a>
            </div>

            <h3 style="color: #667eea;">🚀 What's Next?</h3>
            <ul style="line-height: 2;">
              <li>Log in to your dashboard</li>
              <li>Explore your project management tools</li>
              <li>Upload your brand assets</li>
              <li>Start collaborating with our team</li>
            </ul>
          </div>
          <div class="footer">
            ${emailFooter}
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Welcome to BookYourBrands CRM!\n\nHello ${name},\n\nYour account has been created.\n\nLogin URL: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.\n\nUse Project Chat or BYB Support for help.\nDo not reply to this email.`;

    // Send email
    const info = await transporter.sendMail({
      from: `"BookYourBrands CRM" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to BookYourBrands CRM',
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    });

  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
