"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendProjectCompletedEmail = sendProjectCompletedEmail;
const nodemailer = __importStar(require("nodemailer"));
// CRM Email Transporter - For onboarding
const crmTransporter = nodemailer.createTransport({
    host: 'mail.bookyourbrands.com',
    port: 465,
    secure: true,
    auth: {
        user: 'crm@bookyourbrands.com',
        pass: 'Arpit@123'
    },
    tls: {
        rejectUnauthorized: false
    }
});
// Gmail Transporter - For Project Completion
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bookyourbrandscrm@gmail.com',
        pass: 'qzng wikf gddz ppwc'
    }
});
async function sendWelcomeEmail(params) {
    const { to, name, email, password, loginUrl } = params;
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
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
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
          <h1>Welcome to Your CRM!</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          
          <p>Your CRM account has been created! 🎉</p>
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            
            <div class="credential-item">
              <span class="credential-label">Login URL:</span>
              <a href="${loginUrl}" class="credential-value">${loginUrl}</a>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Email:</span>
              <span class="credential-value">${email}</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important:</strong> Please change your password after first login.
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">Login to Dashboard</a>
          </div>

          <p>Best regards,<br><strong>BookYourBrands Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} BookYourBrands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    try {
        const info = await crmTransporter.sendMail({
            from: '"BookYourBrands CRM" <crm@bookyourbrands.com>',
            to,
            subject: '🎉 Welcome to BookYourBrands CRM!',
            html: htmlContent,
            text: `Welcome!\n\nEmail: ${email}\nPassword: ${password}\nLogin: ${loginUrl}`
        });
        console.log('✅ Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
}
async function sendProjectCompletedEmail(params) {
    const { to, clientName, projectName, projectUrl } = params;
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
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; background: #ffffff; }
        .highlight-box { 
          background: #f0fdf4; 
          border-left: 4px solid #22c55e; 
          padding: 20px; 
          margin: 25px 0;
          border-radius: 5px;
        }
        .project-name {
          font-size: 20px;
          font-weight: bold;
          color: #22c55e;
          margin: 10px 0;
        }
        .button { 
          display: inline-block; 
          background: #22c55e; 
          color: white !important; 
          padding: 15px 40px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
          font-weight: 600;
        }
        .support-box {
          background: #e7f3ff;
          border-left: 4px solid #2196F3;
          padding: 20px;
          margin: 25px 0;
          border-radius: 5px;
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
          <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
          <h1>Your Project is Complete!</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;">Hello <strong>${clientName}</strong>,</p>
          
          <p>Great news! Your project has been completed and is ready for review.</p>
          
          <div class="highlight-box">
            <p style="margin: 0; color: #666;">✅ <strong>Project Completed</strong></p>
            <p class="project-name">${projectName}</p>
            <p style="margin: 0; color: #666; font-size: 14px;">All deliverables are now available in your dashboard.</p>
          </div>

          <p>You can now:</p>
          <ul style="line-height: 1.8;">
            <li>📥 <strong>Download</strong> your completed reels</li>
            <li>👀 <strong>Review</strong> the final output</li>
            <li>💬 <strong>Share feedback</strong> if needed</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${projectUrl}" class="button">View Project</a>
          </div>

          <div class="support-box">
            <p style="margin: 0 0 10px 0;"><strong>💬 Need Help or Have Feedback?</strong></p>
            <p style="margin: 0; font-size: 14px;">
              If you have any questions or concerns about the project, please feel free to chat with our team using the <strong>Project Chat</strong> feature in your dashboard, or reach out via our <strong>Support Chat</strong>.
            </p>
          </div>

          <p style="margin-top: 30px;">Thank you for choosing BookYourBrands!</p>
          
          <p>Best regards,<br>
          <strong>BookYourBrands Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>BookYourBrands</strong> - Your Creative Partner</p>
          <p>© ${new Date().getFullYear()} BookYourBrands. All rights reserved.</p>
          <p style="margin-top: 10px; color: #999;">⚠️ This is an automated email. Please do not reply to this message.<br>Use the chat features in your dashboard to communicate with our team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    try {
        const info = await gmailTransporter.sendMail({
            from: '"BookYourBrands Team" <bookyourbrandscrm@gmail.com>',
            to,
            subject: `🎉 Your Project "${projectName}" is Complete!`,
            html: htmlContent,
            text: `Hello ${clientName},\n\nGreat news! Your project "${projectName}" has been completed.\n\nView it here: ${projectUrl}\n\nIf you have any questions, please use the Project Chat feature in your dashboard.\n\nBest regards,\nBookYourBrands Team`
        });
        console.log('✅ Project completion email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=email-service.js.map