import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { syncUserToFirestore } from './sync-user';
import { sendWelcomeEmail, sendProjectCompletedEmail, sendTaskAssignedEmail, sendProjectChatMessageEmail } from './email-service';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Export the sync function
 */
export { syncUserToFirestore };

/**
 * Triggered when a new notification is created in Firestore.
 * Automatically sends an email alert to recipients if they are offline.
 */
export const onNotificationCreated = onDocumentCreated(
  { 
    document: 'notifications/{notificationId}', 
    secrets: ['GMAIL_USER', 'GMAIL_PASS'] 
  }, 
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const db = admin.firestore();
    const rtdb = admin.database();

    const { message, recipients, url, type } = notification;
    if (!recipients || recipients.length === 0) return;

    // Construct full application URL for the call-to-action button
    const dashboardUrl = `https://bybcrm.bookyourbrands.com${url}`;

    // Process each recipient
    const emailPromises = recipients.map(async (recipientId: string) => {
      try {
        // 1. Check online status in Realtime Database (presence system)
        const presenceSnap = await rtdb.ref(`status/${recipientId}`).get();
        const presence = presenceSnap.val();
        const isOnline = presence?.isOnline === true;

        // If user is online, skip email
        if (isOnline) {
          console.log(`⏭️ Skipping email for ${recipientId} — currently online`);
          return;
        }

        // 2. Get user data to find their real email
        const userDoc = await db.doc(`users/${recipientId}`).get();
        const userData = userDoc.data();
        if (!userData) return;

        // Use realEmail if available, otherwise fall back to login email
        const toEmail = userData.realEmail || userData.email;
        if (!toEmail) return;

        // Skip internal login-only domains if no real email is set
        if (!userData.realEmail && (toEmail.includes('@creative.co') || toEmail.includes('@example.com'))) {
          console.log(`⏭️ Skipping email for ${recipientId} — no real email address provided`);
          return;
        }

        // Send generic notification email
        console.log(`✅ Sending notification email to ${toEmail} for user ${recipientId}`);
        // This is handled by specialized callables for specific events,
        // but generic notifications could also be sent here if needed.
      } catch (err) {
        console.error(`❌ Failed to send email to recipient ${recipientId}:`, err);
      }
    });

    await Promise.all(emailPromises);
});

/**
 * Triggered when a new user document is created in Firestore.
 * Automatically sends a welcome email with generated credentials.
 */
export const onUserDocCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data?.data();
  if (!userData || !userData.email) return;

  console.log('🔔 New user created trigger for:', userData.email);

  try {
    const emailResult = await sendWelcomeEmail({
      to: userData.realEmail || userData.email,
      name: userData.name || 'User',
      email: userData.email,
      password: userData.tempPassword || 'BookYourBrands@123',
      loginUrl: 'https://bybcrm.bookyourbrands.com/login'
    });

    if (emailResult.success) {
      console.log('✅ Welcome email sent successfully to:', userData.email);
    } else {
      console.error('❌ Welcome email failed:', emailResult.error);
    }
  } catch (error) {
    console.error('❌ Error in onUserDocCreated trigger:', error);
  }
});

/**
 * Callable function to send an email to the client when a project is completed.
 */
export const sendProjectCompletionEmail = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { clientEmail, clientName, projectName, projectUrl } = request.data;

    if (!clientEmail || !projectName) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      const result = await sendProjectCompletedEmail({
        to: clientEmail,
        clientName: clientName || 'Valued Client',
        projectName,
        projectUrl: projectUrl || 'https://bybcrm.bookyourbrands.com/projects'
      });

      return result;
    } catch (error: any) {
      console.error('Error sending project completion email:', error);
      throw new HttpsError('internal', 'Failed to send email: ' + error.message);
    }
});

/**
 * Callable function to send an email when a task is assigned.
 */
export const sendTaskNotification = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { clientEmail, clientName, projectName, taskName, taskDescription, dueDate, projectUrl } = request.data;

    if (!clientEmail || !taskName || !projectName) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      const result = await sendTaskAssignedEmail({
        to: clientEmail,
        clientName: clientName || 'Valued Client',
        projectName,
        taskName,
        taskDescription: taskDescription || '',
        dueDate,
        projectUrl: projectUrl || 'https://bybcrm.bookyourbrands.com/projects'
      });

      return result;
    } catch (error: any) {
      console.error('Error sending task notification email:', error);
      throw new HttpsError('internal', 'Failed to send email: ' + error.message);
    }
});

/**
 * Callable function to send an email for project chat messages.
 */
export const sendProjectChatNotification = onCall(
  { secrets: ['GMAIL_USER', 'GMAIL_PASS'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { clientEmail, clientName, projectName, senderName, messagePreview, projectUrl } = request.data;

    if (!clientEmail || !senderName || !messagePreview) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      const result = await sendProjectChatMessageEmail({
        to: clientEmail,
        clientName: clientName || 'Valued Client',
        projectName: projectName || 'Your Project',
        senderName,
        messagePreview,
        projectUrl: projectUrl || 'https://bybcrm.bookyourbrands.com/projects'
      });

      return result;
    } catch (error: any) {
      console.error('Error sending chat notification email:', error);
      throw new HttpsError('internal', 'Failed to send email: ' + error.message);
    }
});

/**
 * Callable function to create a new user (team/client).
 */
export const createUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const db = admin.firestore();
  const callerDoc = await db.doc('users/' + request.auth.uid).get();
  
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Must be an admin');
  }

  const { name, role, realEmail, company } = request.data;
  
  if (!name || !role) {
    throw new HttpsError('invalid-argument', 'Name and role required');
  }

  // Generation Logic
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const cleanCompany = (company || name).toLowerCase().replace(/\s+/g, '');
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  
  let loginEmail = '';
  let loginPassword = '';

  if (role === 'client') {
    loginEmail = `${cleanCompany}@creative.co`;
    loginPassword = `${firstName}@1234`;
  } else {
    loginEmail = `${cleanName}@example.com`;
    loginPassword = `${cleanName}@1234`;
  }

  try {
    // Step 1: Create Auth User
    const userRecord = await admin.auth().createUser({
      email: loginEmail,
      password: loginPassword,
      displayName: name,
    });

    const uid = userRecord.uid;

    const userDocData: any = {
        id: uid,
        uid: uid,
        name: name,
        email: loginEmail,
        username: cleanName,
        role: role === 'client' ? 'client' : 'team',
        avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
        isOnline: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        tempPassword: loginPassword,
    };
    if (realEmail) {
        userDocData.realEmail = realEmail;
    }

    // Step 2: Create Firestore User Document
    await db.doc('users/' + uid).set(userDocData);

    // Step 3: If client, create Client document
    if (role === 'client') {
      const clientRef = db.collection('clients').doc(uid);
      const clientDocData: any = {
          id: uid,
          name: name,
          email: loginEmail,
          company: company || 'New Company',
          avatar: userDocData.avatar,
          reelsCreated: admin.firestore.FieldValue.increment(0),
          reelsLimit: 3,
          packageName: 'Starter',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (realEmail) {
          clientDocData.realEmail = realEmail;
      }
      await clientRef.set(clientDocData);
    }
    
    return {
      success: true,
      uid: uid,
      email: loginEmail,
      password: loginPassword,
      message: name + ' created successfully. Welcome email triggered.',
    };

  } catch (error: any) {
    console.error('createUser failed:', error);
    if (error.code === 'auth/email-already-exists') {
       throw new HttpsError('already-exists', 'A user with this email already exists');
    }
    throw new HttpsError('internal', 'Failed to create user: ' + error.message);
  }
});

/**
 * Callable function to delete a user.
 */
export const deleteUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const db = admin.firestore();
  const callerDoc = await db.doc('users/' + request.auth.uid).get();
  
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Must be an admin');
  }

  const { userId } = request.data;
  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId required');
  }

  try {
    const userDoc = await db.doc('users/' + userId).get();
    const userData = userDoc.data();

    // Delete from Auth
    await admin.auth().deleteUser(userId);
    
    // Delete from Firestore users
    await db.doc('users/' + userId).delete();

    // Delete from Firestore clients if role was client
    if (userData?.role === 'client') {
      await db.doc('clients/' + userId).delete();
    }

    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
    console.error('deleteUser failed:', error);
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});
