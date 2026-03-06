import nodemailer from 'nodemailer';

/**
 * @fileOverview BookYourBrands Email Service
 * Handles onboarding emails and system notifications using BigRock SMTP.
 * Note: This file does NOT use "use server" because it exports non-function objects.
 */

// CRM Email Transporter - For onboarding and credentials
const crmTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.bookyourbrands.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.CRM_EMAIL_USER || 'crm@bookyourbrands.com',
    pass: process.env.CRM_EMAIL_PASSWORD || 'Arpit@123'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Updates Email Transporter - For project and task notifications
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

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends a general notification email using the Updates transporter.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const info = await updatesTransporter.sendMail({
      from: `"BookYourBrands Updates" <${process.env.UPDATES_EMAIL_USER || 'updates@bookyourbrands.com'}>`,
      to,
      subject,
      text: text || '',
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// Email Footer Component
export const emailFooter = `
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

// Notification Email Templates
export const emailTemplates = {
  notification: (userName: string, notificationMessage: string, notificationType: string, actionUrl?: string) => ({
    subject: `🔔 ${notificationType} - BookYourBrands CRM`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { background: #ffffff; padding: 30px 20px; }
          .notification-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 New Notification</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${userName}</strong>,</p>
            
            <div class="notification-box">
              <p style="margin: 0; font-size: 15px; color: #333;">${notificationMessage}</p>
            </div>

            ${actionUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" class="button">View in Dashboard →</a>
              </div>
            ` : ''}

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              You received this notification because there's an update in your BookYourBrands CRM account.
            </p>
          </div>
          <div class="footer">
            ${emailFooter}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `BookYourBrands Notification\n\nHello ${userName},\n\n${notificationMessage}\n\n${actionUrl ? 'View in dashboard: ' + actionUrl + '\n\n' : ''}Need help? Use the Project Chat or BYB Support feature in your dashboard.\n\nDo not reply to this email.`
  }),

  taskAssigned: (userName: string, taskTitle: string, projectName: string, dueDate: string, dashboardUrl: string) => ({
    subject: `📋 New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { background: #ffffff; padding: 30px 20px; }
          .task-card { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .footer { background: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
            <p>You've been assigned a new task:</p>
            
            <div class="task-card">
              <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">${taskTitle}</h2>
              <div class="info-row" style="display: block; padding: 8px 0;">
                <span style="color: #666;">Project:</span>
                <strong>${projectName}</strong>
              </div>
              <div class="info-row" style="display: block; padding: 8px 0; border: none;">
                <span style="color: #666;">Due Date:</span>
                <strong style="color: #e63946;">${dueDate}</strong>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">View Task in Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            ${emailFooter}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New Task Assigned\n\nHello ${userName},\n\nTask: ${taskTitle}\nProject: ${projectName}\nDue: ${dueDate}\n\nView in dashboard: ${dashboardUrl}\n\nUse Project Chat or BYB Support for discussions.\nDo not reply to this email.`
  }),

  projectUpdate: (userName: string, projectName: string, updateMessage: string, projectUrl: string) => ({
    subject: `🔄 Project Update: ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { background: #ffffff; padding: 30px 20px; }
          .update-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔄 Project Update</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
            <p>There's a new update on your project <strong>${projectName}</strong>:</p>
            
            <div class="update-box">
              <p style="margin: 0; font-size: 15px;">${updateMessage}</p>
            </div>

            <div style="text-align: center;">
              <a href="${projectUrl}" class="button">View Project →</a>
            </div>
          </div>
          <div class="footer">
            ${emailFooter}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Project Update: ${projectName}\n\nHello ${userName},\n\n${updateMessage}\n\nView project: ${projectUrl}\n\nUse Project Chat for discussions.\nDo not reply to this email.`
  }),

  welcomeClient: (name: string, email: string, password: string, loginUrl: string) => ({
    subject: '🎉 Welcome to BookYourBrands CRM',
    html: `
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
    `,
    text: `Welcome to BookYourBrands CRM!\n\nHello ${name},\n\nYour account has been created.\n\nLogin URL: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.\n\nUse Project Chat or BYB Support for help.\nDo not reply to this email.`
  })
};

/**
 * Sends a specific "Welcome" email using the CRM transporter.
 */
export async function sendWelcomeEmail(params: { to: string; name: string; email: string; password: string; loginUrl: string; }) {
  const content = emailTemplates.welcomeClient(params.name, params.email, params.password, params.loginUrl);
  try {
    const info = await crmTransporter.sendMail({
      from: `"BookYourBrands CRM" <${process.env.CRM_EMAIL_USER || 'crm@bookyourbrands.com'}>`,
      to: params.to,
      subject: content.subject,
      html: content.html,
      text: content.text
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendProjectCompletedEmail(to: string, projectName: string, projectUrl: string) {
  const message = `Great news! Your project <strong>"${projectName}"</strong> has been completed and is ready for review.<br><br>All deliverables are now available in your dashboard.`;
  const content = emailTemplates.notification('Client', message, 'Project Completed', projectUrl);
  return sendEmail({ to, subject: content.subject, html: content.html, text: content.text });
}

export async function sendTaskStatusChangedEmail(to: string, taskName: string, oldStatus: string, newStatus: string, projectUrl: string) {
  const message = `The task <strong>"${taskName}"</strong> has been updated.<br><br>Status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.`;
  const content = emailTemplates.notification('Team Member', message, 'Task Update', projectUrl);
  return sendEmail({ to, subject: content.subject, html: content.html, text: content.text });
}
