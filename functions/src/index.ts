import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { syncUserToFirestore } from './sync-user';
import { sendWelcomeEmail, sendProjectCompletedEmail } from './email-service';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Export the sync function
 */
export { syncUserToFirestore };

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
export const sendProjectCompletionEmail = onCall(async (request) => {
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
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  const domain = role === 'client' ? 'creative.co' : 'example.com';
  const email = `${cleanName}@${domain}`;
  const password = `${firstName}@1234`;

  try {
    // Step 1: Create Auth User
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    const userDocData: any = {
        id: uid,
        uid: uid,
        name: name,
        email: email,
        username: cleanName,
        role: role === 'client' ? 'client' : 'team',
        avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
        isOnline: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        tempPassword: password,
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
          email: email,
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
      email: email,
      password: password,
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
