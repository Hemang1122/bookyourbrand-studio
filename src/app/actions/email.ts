'use server';
import nodemailer from 'nodemailer';

/**
 * Server Action to send a welcome email to a new client.
 * Uses GMAIL_USER and GMAIL_APP_PASSWORD from environment variables.
 */
export async function sendWelcomeEmailAction(name: string, email: string, password: string) {
  try {
    // Priority: Use GMAIL_USER/PASS if available, fallback to provided default
    const user = process.env.GMAIL_USER || 'bookyourbrandscrm@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!pass) {
      throw new Error('GMAIL_APP_PASSWORD is not configured in environment variables.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"BookYourBrands" <${user}>`,
      to: email,
      subject: '🎉 Welcome to BookYourBrands CRM',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h1 style="color: #7C3AED;">Welcome ${name}! 👋</h1>
          <p style="font-size: 16px; color: #333;">Your BookYourBrands CRM account has been successfully created. We're excited to have you on board!</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7C3AED;">
            <h3 style="margin-top: 0; color: #7C3AED;">🔐 Your Login Credentials</h3>
            <p><strong>Portal URL:</strong> <a href="https://bybcrm.bookyourbrands.com" style="color: #7C3AED;">https://bybcrm.bookyourbrands.com</a></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #e0e0e0; padding: 2px 5px; border-radius: 3px;">${password}</code></p>
          </div>

          <p style="background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 14px;">
            <strong>⚠️ Note:</strong> Please change your password after your first login for better security.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://bybcrm.bookyourbrands.com" style="background: #7C3AED; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
          </div>

          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} BookYourBrands. All rights reserved.
          </p>
        </div>
      `
    });

    console.log('✅ Welcome email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email Action Failure:', error.message);
    return { success: false, error: error.message };
  }
}
