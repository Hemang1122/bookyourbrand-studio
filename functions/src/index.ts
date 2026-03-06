
import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Triggered when a new user document is created in Firestore.
 * Currently just logs, as email dispatch is handled via the Next.js API route 
 * for more granular control over templates and passwords.
 */
export const onUserDocCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data?.data();
  if (!userData || !userData.email) return;
  console.log('🔔 New user created document:', userData.email);
});

/**
 * Callable function to create a new user (admin/team/client).
 * Handles Firebase Auth account creation and initial Firestore doc.
 * Returns the generated credentials so the frontend can send them via email.
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

  const { name, role, realEmail } = request.data;
  
  if (!name || !role) {
    throw new HttpsError('invalid-argument', 'Name and role required');
  }

  // Generation Logic
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  let loginEmail = '';
  let loginPassword = '';

  if (role === 'client') {
    // For clients, we use their actual email if provided, otherwise fallback
    loginEmail = realEmail || `${cleanName}@creative.co`;
    // Generate a random password if not provided (usually random for clients)
    loginPassword = Math.random().toString(36).slice(-8);
  } else {
    // For team, use the deterministic pattern
    loginEmail = `${cleanName}@example.com`;
    loginPassword = `${cleanName}@1234`;
  }

  let uid = '';

  try {
    const userRecord = await admin.auth().createUser({
      email: loginEmail,
      password: loginPassword,
      displayName: name,
    });
    uid = userRecord.uid;
    console.log('✅ Created new Auth user:', uid);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Auth user already exists, fetching UID...');
      const existingUser = await admin.auth().getUserByEmail(loginEmail);
      uid = existingUser.uid;
    } else {
      console.error('createUser Auth failed:', error);
      throw new HttpsError('internal', 'Auth failure: ' + error.message);
    }
  }

  try {
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
        tempPassword: loginPassword, // Stored temporarily so trigger or admin can see it
    };
    if (realEmail && role === 'client') {
        userDocData.realEmail = realEmail;
    }

    await db.doc('users/' + uid).set(userDocData, { merge: true });

    if (role === 'client') {
      const clientRef = db.collection('clients').doc(uid);
      const clientDocData: any = {
          id: uid,
          name: name,
          email: loginEmail,
          company: request.data.company || 'New Company',
          avatar: userDocData.avatar,
          reelsCreated: 0,
          reelsLimit: 3,
          packageName: 'Starter',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (realEmail) {
          clientDocData.realEmail = realEmail;
      }
      await clientRef.set(clientDocData, { merge: true });
    }
    
    return {
      success: true,
      uid: uid,
      email: loginEmail,
      password: loginPassword,
      message: name + ' processed successfully.',
    };

  } catch (error: any) {
    console.error('createUser Firestore failed:', error);
    throw new HttpsError('internal', 'Database failure: ' + error.message);
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

    await admin.auth().deleteUser(userId);
    await db.doc('users/' + userId).delete();

    if (userData?.role === 'client') {
      await db.doc('clients/' + userId).delete();
    }

    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
    console.error('deleteUser failed:', error);
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});
