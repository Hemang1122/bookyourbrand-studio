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

if (admin.apps.length === 0) {
    admin.initializeApp();
}

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

    // Only proceed if status has actually changed
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

      // Identify who updated the task (if possible, fallback to 'Someone')
      // Note: In Firestore triggers, we don't directly have the 'updatedBy' user ID 
      // unless it was written into the document. Our TaskRemark logic usually has this.
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

// ─── Trigger: Project Chat Message Created ─────────────────────────────────
export const onProjectChatMessageCreated = onDocumentCreated(
  { document: 'projects/{projectId}/chat-messages/{messageId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const db = admin.firestore();
    const { projectId } = event.params;

    try {
      const projectDoc = await db.doc(`projects/${projectId}`).get();
      const projectData = projectDoc.data();
      if (!projectData) return;

      const recipients = [
        projectData.client?.id,
        ...(projectData.team_ids || [])
      ].filter(id => id && id !== message.senderId);

      for (const recipientId of recipients) {
        const userDoc = await db.doc(`users/${recipientId}`).get();
        const userData = userDoc.data();
        const emailTo = userData?.realEmail || userData?.email;

        if (emailTo) {
          await sendProjectChatMessageEmail({
            to: emailTo,
            clientName: userData?.name || 'User',
            projectName: projectData.name,
            senderName: message.senderName,
            messagePreview: message.text || 'Shared a media file',
            projectUrl: `https://bybcrm.bookyourbrands.com/projects/${projectId}?openChat=true`
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

// ─── Existing Notification Trigger ──────────────────────────────────────────
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

// ─── Existing User Onboarding Trigger ───────────────────────────────────────
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

// ─── Callable Functions (API Endpoints) ─────────────────────────────────────
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
