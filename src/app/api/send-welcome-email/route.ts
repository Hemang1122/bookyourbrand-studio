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
    const { name, email, username, password, userType } = await request.json();

    console.log('📧 Sending welcome email to:', email);

    const loginUrl = 'https://bybcrm.bookyourbrands.com';
    
    // Determine user type label
    const roleLabel = userType === 'team' ? 'Team Member' : 'Client';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
          }
          .email-wrapper {
            width: 100%;
            background-color: #f7fafc;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .intro-text {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 30px;
          }
          .credentials-card {
            background: #f7fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 28px;
            margin: 30px 0;
          }
          .credentials-card h3 {
            color: #2d3748;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .credential-row {
            margin: 16px 0;
          }
          .credential-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            font-weight: 600;
          }
          .credential-value {
            font-size: 15px;
            color: #1a202c;
            font-weight: 500;
            background: #ffffff;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #cbd5e0;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            word-break: break-all;
          }
          .security-notice {
            background: #fef5e7;
            border-left: 4px solid #f39c12;
            padding: 16px 20px;
            margin: 25px 0;
            border-radius: 6px;
          }
          .security-notice strong {
            color: #d68910;
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .security-notice p {
            color: #7d6608;
            font-size: 13px;
            margin: 0;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          .help-section {
            background: #edf2f7;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0 25px 0;
          }
          .help-section h4 {
            color: #2d3748;
            font-size: 14px;
            margin: 0 0 12px 0;
            font-weight: 600;
          }
          .help-section ul {
            margin: 0;
            padding-left: 20px;
            color: #4a5568;
            font-size: 13px;
            line-height: 1.8;
          }
          .help-section li {
            margin: 6px 0;
          }
          .footer {
            background: #2d3748;
            padding: 35px 30px;
            text-align: center;
          }
          .no-reply-badge {
            display: inline-block;
            background: #4a5568;
            color: #ffffff;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
            letter-spacing: 0.3px;
          }
          .footer-text {
            color: #a0aec0;
            font-size: 12px;
            line-height: 1.6;
            margin: 8px 0;
          }
          .footer-text strong {
            color: #cbd5e0;
          }
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 25px 0;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
            .credentials-card { padding: 20px; }
            .cta-button { padding: 14px 30px; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            
            <!-- Header -->
            <div class="header">
              <h1>🎨 Welcome to BookYourBrands</h1>
              <p>${roleLabel} Account Created</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <div class="greeting">
                Hello <strong>${name}</strong>,
              </div>
              
              <p class="intro-text">
                Your BookYourBrands CRM account has been successfully created. 
                We're excited to have you on board! Use the credentials below to access your dashboard and ${userType === 'team' ? 'collaborate with the team' : 'track your projects'}.
              </p>

              <!-- Credentials Card -->
              <div class="credentials-card">
                <h3>🔐 Your Login Credentials</h3>
                
                <div class="credential-row">
                  <div class="credential-label">Portal URL</div>
                  <div class="credential-value">${loginUrl}</div>
                </div>

                <div class="credential-row">
                  <div class="credential-label">Username / Email</div>
                  <div class="credential-value">${username}</div>
                </div>

                <div class="credential-row">
                  <div class="credential-label">Password</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>

              <!-- Security Notice -->
              <div class="security-notice">
                <strong>⚠️ Security Reminder</strong>
                <p>Please change your password after your first login to keep your account secure.</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">Access Your Dashboard →</a>
              </div>

              <div class="divider"></div>

              <!-- Help Section -->
              <div class="help-section">
                <h4>💬 Need Help or Have Questions?</h4>
                <ul>
                  <li><strong>Project Discussions:</strong> Use the Project Chat feature in your dashboard</li>
                  <li><strong>General Support:</strong> Use the BYB Support feature for assistance</li>
                  <li><strong>Technical Issues:</strong> Contact your account manager</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="no-reply-badge">
                ⚠️ DO NOT REPLY TO THIS EMAIL
              </div>
              
              <p class="footer-text">
                This is an automated notification from BookYourBrands CRM.<br>
                Please do not reply to this email address.
              </p>
              
              <p class="footer-text" style="margin-top: 20px;">
                For support, use the <strong>chat features</strong> inside your dashboard.
              </p>
              
              <p class="footer-text" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #4a5568;">
                © ${new Date().getFullYear()} BookYourBrands. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to BookYourBrands CRM!

Hello ${name},

Your ${roleLabel} account has been successfully created.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Portal URL: ${loginUrl}
Username: ${username}
Password: ${password}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ SECURITY REMINDER
Please change your password after your first login.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEED HELP?
- Project Discussions: Use Project Chat in your dashboard
- General Support: Use BYB Support feature
- Technical Issues: Contact your account manager

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DO NOT REPLY TO THIS EMAIL
This is an automated message. For support, use the chat features in your dashboard.

© ${new Date().getFullYear()} BookYourBrands. All rights reserved.
    `.trim();

    // Send email
    const info = await transporter.sendMail({
      from: `"BookYourBrands" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🎨 Welcome to BookYourBrands - Your ${roleLabel} Account`,
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