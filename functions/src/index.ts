import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendWelcomeEmail } from './email-service';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Triggered when a new user document is created in Firestore.
 * Sends a welcome email with credentials.
 */
export const onUserDocCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data?.data();
  if (!userData || !userData.email) return;

  console.log('🔔 New user created:', userData.email);

  try {
    const emailResult = await sendWelcomeEmail({
      to: userData.realEmail || userData.email,
      name: userData.name || 'User',
      email: userData.email,
      password: userData.tempPassword || 'BookYourBrands@123',
      loginUrl: 'https://bybcrm.bookyourbrands.com/login'
    });

    if (emailResult.success) {
      console.log('✅ Email sent successfully to:', userData.email);
    } else {
      console.error('❌ Email failed:', emailResult.error);
    }
  } catch (error) {
    console.error('❌ Error in onUserDocCreated trigger:', error);
  }
});

/**
 * Callable function to create a new user (admin/team/client).
 * Handles Firebase Auth account creation and initial Firestore doc.
 */
export const createUser = onCall(async (request) => {
  // Verify caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Verify caller is an admin
  const callerDoc = await admin.firestore()
    .doc('users/' + request.auth.uid).get();
  
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Must be an admin');
  }

  const { name, role, realEmail } = request.data;
  
  if (!name || !role) {
    throw new HttpsError('invalid-argument', 'Name and role required');
  }

  // Generate email and password from name
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const domain = role === 'client' ? 'creative.co' : 'example.com';
  const email = cleanName + '@' + domain;
  const password = cleanName + '@1234';

  try {
    // Step 1: Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const userDocData: any = {
        id: userRecord.uid,
        uid: userRecord.uid,
        name: name,
        email: email,
        role: role === 'client' ? 'client' : 'team',
        avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
        isOnline: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        tempPassword: password, // Store password so trigger can send it
    };
    if (realEmail) {
        userDocData.realEmail = realEmail;
    }

    // Step 2: Create Firestore user document
    await admin.firestore().doc('users/' + userRecord.uid).set(userDocData);

    // Step 3: If client, create client document too
    if (role === 'client') {
      const clientRef = admin.firestore()
        .collection('clients').doc(userRecord.uid);
      
      const clientDocData: any = {
          id: userRecord.uid,
          name: name,
          email: email,
          realEmail: realEmail || null,
          avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 2),
          reelsCreated: 0,
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
      uid: userRecord.uid,
      email: email,
      password: password,
      message: name + ' created successfully. Welcome email is being processed.',
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

  const callerDoc = await admin.firestore()
    .doc('users/' + request.auth.uid).get();
  
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Must be an admin');
  }

  const { userId } = request.data;
  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId required');
  }

  try {
    const userDoc = await admin.firestore().doc('users/' + userId).get();
    const userData = userDoc.data();

    await admin.auth().deleteUser(userId);
    await admin.firestore().doc('users/' + userId).delete();

    if (userData?.role === 'client') {
      await admin.firestore().doc('clients/' + userId).delete();
    }

    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
    console.error('deleteUser failed:', error);
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});
