import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { syncUserToFirestore } from './sync-user';
import { 
  sendWelcomeEmail, 
  sendProjectCompletedEmail, 
  sendTaskAssignedEmail, 
  sendProjectChatMessageEmail,
  sendTaskStatusUpdateEmail
} from './email-service';
import * as nodemailer from 'nodemailer';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'bookyourbrandscrm@gmail.com',
    pass: process.env.GMAIL_PASS || 'qzng wikf gddz ppwc'
  }
});

export { syncUserToFirestore };

// ─── Trigger: Task Created ──────────────────────────────────────────────────
export const onTaskCreated = onDocumentCreated(
  { document: 'tasks/{taskId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (event) => {
    const task = event.data?.data();
    if (!task) return;

    const db = admin.firestore();
    
    try {
      const assignedUserId = task.assignedTo?.id || task.assignedTo;
      if (!assignedUserId) return;

      const userDoc = await db.doc(`users/${assignedUserId}`).get();
      const userData = userDoc.data();
      const emailTo = userData?.realEmail || userData?.email;
      
      if (!emailTo) return;

      const projectDoc = await db.doc(`projects/${task.projectId}`).get();
      const projectData = projectDoc.data();
      const projectName = projectData?.name || 'Unknown Project';

      await sendTaskAssignedEmail({
        to: emailTo,
        clientName: userData?.name || 'Team Member',
        projectName,
        taskName: task.title,
        taskDescription: task.description || '',
        dueDate: task.dueDate || 'Not set',
        projectUrl: `https://bybcrm.bookyourbrands.com/projects/${task.projectId}`
      });

      console.log(`✅ Task notification background alert sent to ${emailTo}`);
    } catch (err) {
      console.error('❌ onTaskCreated Trigger Error:', err);
    }
});

// ─── Trigger: Task Updated (Status Change) ───────────────────────────────────
export const onTaskUpdated = onDocumentUpdated(
  { document: 'tasks/{taskId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after) return;

    if (before.status === after.status) return;

    const db = admin.firestore();
    
    try {
      const assignedUserId = after.assignedTo?.id || after.assignedTo;
      if (!assignedUserId) return;

      const userDoc = await db.doc(`users/${assignedUserId}`).get();
      const userData = userDoc.data();
      const emailTo = userData?.realEmail || userData?.email;
      
      if (!emailTo) return;

      const projectDoc = await db.doc(`projects/${after.projectId}`).get();
      const projectData = projectDoc.data();
      const projectName = projectData?.name || 'Unknown Project';

      const lastRemark = after.remarks && after.remarks.length > 0 
        ? after.remarks[after.remarks.length - 1] 
        : null;
      const updatedBy = lastRemark ? lastRemark.userName : 'a team member';

      await sendTaskStatusUpdateEmail({
        to: emailTo,
        clientName: userData?.name || 'Team Member',
        projectName,
        taskName: after.title,
        taskDescription: after.description || '',
        oldStatus: before.status,
        newStatus: after.status,
        updatedBy,
        projectUrl: `https://bybcrm.bookyourbrands.com/projects/${after.projectId}`
      });

      console.log(`✅ Task status notification sent to ${emailTo} (${before.status} → ${after.status})`);
    } catch (err) {
      console.error('❌ onTaskUpdated Trigger Error:', err);
    }
});

// ─── Trigger: Smart Project Chat Message (Debounced & Batched) ───────────────
export const onProjectChatMessageCreated = onDocumentCreated(
  { 
    document: 'projects/{projectId}/chat-messages/{messageId}', 
    secrets: ['GMAIL_USER', 'GMAIL_PASS'],
    timeoutSeconds: 540 // Allow 9 minutes for debouncing
  },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const { projectId } = event.params;
    const db = admin.firestore();

    // Wait 5 minutes before sending (debounce)
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

    try {
      // Check if there were more messages after this one (means active conversation)
      const recentMessagesCheck = await db
        .collection('projects').doc(projectId)
        .collection('chat-messages')
        .where('timestamp', '>', message.timestamp)
        .limit(1)
        .get();

      if (!recentMessagesCheck.empty) {
        console.log('Skipping notification - active conversation detected');
        return;
      }

      const projectDoc = await db.doc(`projects/${projectId}`).get();
      const projectData = projectDoc.data();
      if (!projectData) return;

      // Get all messages from last 5 minutes to batch them
      const fiveMinutesAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
      const batchMessagesSnapshot = await db
        .collection('projects').doc(projectId)
        .collection('chat-messages')
        .where('timestamp', '>', fiveMinutesAgo)
        .orderBy('timestamp', 'asc')
        .get();

      const batchMessages = batchMessagesSnapshot.docs.map(d => d.data());
      const activeSenders = new Set(batchMessages.map(m => m.senderId));

      const recipients = [
        projectData.client?.id,
        ...(projectData.team_ids || [])
      ].filter(id => id && !activeSenders.has(id));

      if (recipients.length === 0) {
        console.log('No recipients - all participants are currently active');
        return;
      }

      const senderName = message.senderName || 'Someone';
      const loginUrl = 'https://bybcrm.bookyourbrands.com';

      for (const recipientId of recipients) {
        const userDoc = await db.doc(`users/${recipientId}`).get();
        const userData = userDoc.data();
        const emailTo = userData?.realEmail || userData?.email;

        if (emailTo) {
          const messagePreview = batchMessages.slice(-3).map(msg => `
            <div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #1f2937;"><strong>${msg.senderName}:</strong> ${msg.text || 'Media file'}</p>
            </div>
          `).join('');

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .badge { background: #667eea; color: white; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
                .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                .footer { background: #f9f9f9; color: #999; padding: 20px; text-align: center; font-size: 11px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💬 New Messages</h1>
                  <p style="opacity: 0.8;">Project: ${projectData.name}</p>
                </div>
                <div class="content">
                  <p>Hello <strong>${userData?.name || 'User'}</strong>,</p>
                  <p>You have <span class="badge">${batchMessages.length} new message${batchMessages.length > 1 ? 's' : ''}</span> waiting for you:</p>
                  
                  ${messagePreview}
                  
                  ${batchMessages.length > 3 ? `<p style="color: #999; font-size: 12px;">+ ${batchMessages.length - 3} more messages...</p>` : ''}

                  <div style="text-align: center;">
                    <a href="${loginUrl}/projects/${projectId}?openChat=true" class="button">Reply in Project Chat</a>
                  </div>

                  <p style="color: #666; font-size: 12px; margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                    💡 <strong>Smart Notifications:</strong> We only send these emails if you haven't been active in the chat for 5 minutes.
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} BookYourBrands. All rights reserved.</p>
                  <p>Do not reply to this automated email.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await transporter.sendMail({
            from: '"BookYourBrands" <bookyourbrandscrm@gmail.com>',
            to: emailTo,
            subject: `💬 ${projectData.name}: ${batchMessages.length} new message${batchMessages.length > 1 ? 's' : ''} from ${senderName}`,
            html: htmlContent
          });
        }
      }
    } catch (err) {
      console.error('❌ onProjectChatMessageCreated Trigger Error:', err);
    }
});

// ─── Trigger: Project Updated (Completion) ──────────────────────────────────
export const onProjectUpdated = onDocumentUpdated(
  { document: 'projects/{projectId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status !== 'Completed' && after.status === 'Completed') {
      try {
        const clientId = after.client?.id;
        if (!clientId) return;

        const db = admin.firestore();
        const clientDoc = await db.doc(`users/${clientId}`).get();
        const clientData = clientDoc.data();
        const emailTo = clientData?.realEmail || clientData?.email;

        if (emailTo) {
          await sendProjectCompletedEmail({
            to: emailTo,
            clientName: clientData?.name || 'Valued Client',
            projectName: after.name,
            projectUrl: `https://bybcrm.bookyourbrands.com/projects/${event.params.projectId}`
          });
          console.log(`✅ Completion notification sent to ${emailTo}`);
        }
      } catch (err) {
        console.error('❌ onProjectUpdated Trigger Error:', err);
      }
    }
});

// ─── Trigger: Generic Notifications ─────────────────────────────────────────
export const onNotificationCreated = onDocumentCreated(
  { document: 'notifications/{notificationId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const db = admin.firestore();
    const rtdb = admin.database();
    const { recipients } = notification;
    if (!recipients || recipients.length === 0) return;

    const emailPromises = recipients.map(async (recipientId: string) => {
      try {
        const presenceSnap = await rtdb.ref(`status/${recipientId}`).get();
        const isOnline = presenceSnap.val()?.isOnline === true;
        if (isOnline) return;

        const userDoc = await db.doc(`users/${recipientId}`).get();
        const userData = userDoc.data();
        const toEmail = userData?.realEmail || userData?.email;
        if (!toEmail || toEmail.includes('@creative.co')) return;

        console.log(`✅ Generic background email sent to ${toEmail}`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${recipientId}:`, err);
      }
    });
    await Promise.all(emailPromises);
});

// ─── Trigger: Onboarding ──────────────────────────────────────────────────
export const onUserDocCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data?.data();
  if (!userData || !userData.email) return;
  try {
    await sendWelcomeEmail({
      to: userData.realEmail || userData.email,
      name: userData.name || 'User',
      email: userData.email,
      password: userData.tempPassword || 'BookYourBrands@123',
      loginUrl: 'https://bybcrm.bookyourbrands.com/login'
    });
  } catch (error) {
    console.error('❌ onUserDocCreated trigger error:', error);
  }
});

// ─── Callable APIs ────────────────────────────────────────────────────────
export const sendProjectCompletionEmail = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, projectUrl } = request.data;
    if (!clientEmail || !projectName) throw new HttpsError('invalid-argument', 'Missing fields');
    return sendProjectCompletedEmail({ to: clientEmail, clientName, projectName, projectUrl });
});

export const sendTaskNotification = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, taskName, taskDescription, dueDate, projectUrl } = request.data;
    return sendTaskAssignedEmail({ to: clientEmail, clientName, projectName, taskName, taskDescription, dueDate, projectUrl });
});

export const sendProjectChatNotification = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, senderName, messagePreview, projectUrl } = request.data;
    return sendProjectChatMessageEmail({ to: clientEmail, clientName, projectName, senderName, messagePreview, projectUrl });
});

export const createUser = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');
  const db = admin.firestore();
  const callerDoc = await db.doc('users/' + request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Must be an admin');
  
  const { name, role, realEmail, company } = request.data;
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const cleanCompany = (company || name).toLowerCase().replace(/\s+/g, '');
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  
  const loginEmail = role === 'client' ? `${cleanCompany}@creative.co` : `${cleanName}@example.com`;
  const loginPassword = role === 'client' ? `${firstName}@1234` : `${cleanName}@1234`;

  try {
    const userRecord = await admin.auth().createUser({ email: loginEmail, password: loginPassword, displayName: name });
    const uid = userRecord.uid;
    const userDocData: any = { id: uid, uid, name, email: loginEmail, username: cleanName, role: role === 'client' ? 'client' : 'team', avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1), isOnline: false, createdAt: admin.firestore.FieldValue.serverTimestamp(), tempPassword: loginPassword };
    if (realEmail) userDocData.realEmail = realEmail;
    await db.doc('users/' + uid).set(userDocData);

    if (role === 'client') {
      await db.doc('clients/' + uid).set({ id: uid, name, email: loginEmail, company: company || 'New Company', reelsCreated: 0, reelsLimit: 3, packageName: 'Starter', createdAt: admin.firestore.FieldValue.serverTimestamp(), realEmail: realEmail || null }, { merge: true });
    }
    return { success: true, uid, email: loginEmail, password: loginPassword };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'User exists');
    throw new HttpsError('internal', error.message);
  }
});

export const deleteUser = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');
  const db = admin.firestore();
  const callerDoc = await db.doc('users/' + request.auth.uid).get();
  if (callerDoc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Must be an admin');
  
  const { userId } = request.data;
  const userDoc = await db.doc('users/' + userId).get();
  const userData = userDoc.data();
  await admin.auth().deleteUser(userId);
  await db.doc('users/' + userId).delete();
  if (userData?.role === 'client') await db.doc('clients/' + userId).delete();
  return { success: true };
});
