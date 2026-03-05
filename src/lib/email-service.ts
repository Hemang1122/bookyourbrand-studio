
import nodemailer from 'nodemailer';

// CRM Email Transporter - For onboarding
const crmTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.bookyourbrands.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true', // SSL
  auth: {
    user: process.env.CRM_EMAIL_USER || 'crm@bookyourbrands.com',
    pass: process.env.CRM_EMAIL_PASSWORD || 'Arpit@123'
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates
  }
});

// Updates Email Transporter - For notifications
const updatesTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.bookyourbrands.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.UPDATES_EMAIL_USER || 'updates@bookyourbrands.com',
    pass: process.env.UPDATES_EMAIL_PASSWORD || 'Arpit@123'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup (server-side only)
if (typeof window === 'undefined') {
  crmTransporter.verify((error) => {
    if (error) {
      console.error('CRM Email connection error:', error);
    } else {
      console.log('✅ CRM Email server ready');
    }
  });

  updatesTransporter.verify((error) => {
    if (error) {
      console.error('Updates Email connection error:', error);
    } else {
      console.log('✅ Updates Email server ready');
    }
  });
}

interface WelcomeEmailParams {
  to: string;
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}

interface NotificationEmailParams {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { to, name, email, password, loginUrl } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 40px 30px;
          background: #ffffff;
        }
        .credentials { 
          background: #f8f9ff; 
          padding: 25px; 
          border-left: 4px solid #667eea; 
          margin: 25px 0;
          border-radius: 5px;
        }
        .credentials h3 {
          margin-top: 0;
          color: #667eea;
        }
        .credential-item {
          margin: 15px 0;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        .credential-label {
          font-weight: 600;
          color: #555;
          display: block;
          margin-bottom: 5px;
        }
        .credential-value {
          font-family: 'Courier New', monospace;
          color: #333;
          font-size: 16px;
        }
        .button { 
          display: inline-block; 
          background: #667eea; 
          color: white !important; 
          padding: 15px 40px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
          font-weight: 600;
        }
        .button:hover {
          background: #5568d3;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .features {
          background: #f8f9ff;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .features ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .features li {
          margin: 10px 0;
        }
        .footer { 
          text-align: center; 
          padding: 30px;
          background: #f8f9fa;
          color: #666; 
          font-size: 13px;
          border-top: 1px solid #e9ecef;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📱 BookYourBrands</div>
          <h1>Welcome to Your CRM Dashboard!</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          
          <p>Congratulations! 🎉 Your CRM account has been successfully created. You now have access to a powerful platform to manage your projects, track deliverables, and collaborate seamlessly with our team.</p>
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            
            <div class="credential-item">
              <span class="credential-label">Login URL:</span>
              <a href="${loginUrl}" class="credential-value">${loginUrl}</a>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Email / Username:</span>
              <span class="credential-value">${email}</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong><br>
            Please change your password immediately after your first login to ensure your account security.
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">🚀 Login to Dashboard</a>
          </div>

          <div class="features">
            <h3 style="margin-top: 0; color: #667eea;">What You Can Do:</h3>
            <ul>
              <li>✅ View and track all your projects in real-time</li>
              <li>💬 Chat directly with our team for support</li>
              <li>📦 Select and manage your content packages</li>
              <li>📊 Monitor project progress and deliverables</li>
              <li>📁 Access all your files in one place</li>
            </ul>
          </div>

          <p>Need help getting started? Our support team is available 24/7 through the chat feature in your dashboard.</p>

          <p style="margin-top: 30px;">Best regards,<br>
          <strong>The BookYourBrands Team</strong><br>
          <a href="https://bookyourbrands.com">bookyourbrands.com</a></p>
        </div>
        
        <div class="footer">
          <p><strong>BookYourBrands</strong> - Your Creative Partner</p>
          <p>© ${new Date().getFullYear()} BookYourBrands. All rights reserved.</p>
          <p style="margin-top: 10px;">This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await crmTransporter.sendMail({
      from: '"BookYourBrands CRM" <crm@bookyourbrands.com>',
      to,
      subject: '🎉 Welcome to BookYourBrands CRM - Your Account is Ready!',
      html: htmlContent,
      text: `Welcome to BookYourBrands CRM!\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\nLogin: ${loginUrl}\n\nPlease change your password after first login.`
    });
    
    console.log('✅ Welcome email sent to:', to, 'Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendNotificationEmail(params: NotificationEmailParams) {
  const { to, subject, title, message, actionUrl, actionText } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .header h2 { margin: 0; font-size: 24px; }
        .content { padding: 40px 30px; background: #ffffff; }
        .message-box { 
          background: #f8f9ff; 
          padding: 25px; 
          border-left: 4px solid #667eea; 
          margin: 25px 0;
          border-radius: 5px;
          font-size: 15px;
        }
        .button { 
          display: inline-block; 
          background: #667eea; 
          color: white !important; 
          padding: 15px 40px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
          font-weight: 600;
        }
        .footer { 
          text-align: center; 
          padding: 30px;
          background: #f8f9fa;
          color: #666; 
          font-size: 13px;
          border-top: 1px solid #e9ecef;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          <div class="message-box">
            ${message}
          </div>

          ${actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" class="button">${actionText || 'View Details'}</a>
            </div>
          ` : ''}

          <p style="margin-top: 30px;">Best regards,<br>
          <strong>BookYourBrands Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>BookYourBrands</strong></p>
          <p>© ${new Date().getFullYear()} BookYourBrands. All rights reserved.</p>
          <p style="margin-top: 10px;">You received this because you have an active account with us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await updatesTransporter.sendMail({
      from: '"BookYourBrands Updates" <updates@bookyourbrands.com>',
      to,
      subject,
      html: htmlContent
    });
    
    console.log('✅ Notification email sent to:', to);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Error sending notification email:', error);
    return { success: false, error: error.message };
  }
}

// Export specific notification functions
export async function sendProjectCompletedEmail(to: string, projectName: string, projectUrl: string) {
  return sendNotificationEmail({
    to,
    subject: `✅ Project Completed: ${projectName}`,
    title: '🎉 Project Completed!',
    message: `Great news! Your project <strong>"${projectName}"</strong> has been completed and is ready for review.<br><br>All deliverables are now available in your dashboard.`,
    actionUrl: projectUrl,
    actionText: 'View Project'
  });
}

export async function sendTaskStatusChangedEmail(
  to: string, 
  taskName: string, 
  oldStatus: string, 
  newStatus: string, 
  projectUrl: string
) {
  return sendNotificationEmail({
    to,
    subject: `📋 Task Update: ${taskName}`,
    title: 'Task Status Updated',
    message: `The task <strong>"${taskName}"</strong> has been updated.<br><br>Status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.`,
    actionUrl: projectUrl,
    actionText: 'View Project'
  });
}

export async function sendNewChatMessageEmail(
  to: string, 
  senderName: string, 
  messagePreview: string, 
  chatUrl: string, 
  chatType: 'project' | 'support'
) {
  const truncatedMessage = messagePreview.length > 150 
    ? messagePreview.substring(0, 150) + '...' 
    : messagePreview;

  return sendNotificationEmail({
    to,
    subject: `💬 New ${chatType === 'project' ? 'Project' : 'Support'} Message from ${senderName}`,
    title: `New ${chatType === 'project' ? 'Project' : 'Support'} Message`,
    message: `<strong>${senderName}</strong> sent you a message:<br><br><em>"${truncatedMessage}"</em>`,
    actionUrl: chatUrl,
    actionText: 'Reply Now'
  });
}

export async function sendProjectAssignedEmail(
  to: string, 
  projectName: string, 
  deadline: string, 
  projectUrl: string
) {
  return sendNotificationEmail({
    to,
    subject: `🎯 New Project Assignment: ${projectName}`,
    title: 'You\'ve Been Assigned to a Project',
    message: `You have been assigned to work on <strong>"${projectName}"</strong>.<br><br>Deadline: <strong>${deadline}</strong><br><br>Please review the project details and start working on it.`,
    actionUrl: projectUrl,
    actionText: 'View Project Details'
  });
}
