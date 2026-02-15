import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// The URL of your deployed Next.js application.
// IMPORTANT: You will need to set this in your function's environment variables.
const APP_URL = functions.config().app?.url || "http://localhost:9002";


export const createUser = onCall(async (request) => {
  // Verify caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Verify caller is an admin by checking Firestore
  const callerDoc = await admin.firestore()
    .doc('users/' + request.auth.uid).get();
  
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Must be an admin');
  }

  const { name, role } = request.data;
  
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

    // Step 2: Create Firestore user document
    await admin.firestore().doc('users/' + userRecord.uid).set({
      id: userRecord.uid,
      uid: userRecord.uid,
      name: name,
      email: email,
      role: role === 'client' ? 'client' : 'team',
      avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
      isOnline: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Step 3: If client, create client document too
    if (role === 'client') {
      const clientRef = admin.firestore()
        .collection('clients').doc(userRecord.uid);
      await clientRef.set({
        id: userRecord.uid,
        name: name,
        email: email,
        avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 2),
        reelsCreated: 0,
        reelsLimit: 3,
        packageName: 'Starter',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      uid: userRecord.uid,
      email: email,
      password: password,
      message: name + ' created successfully',
    };

  } catch (error: any) {
    console.error('createUser failed:', JSON.stringify({
       code: error.code,
       message: error.message,
       stack: error.stack,
     }));
     
     if (error.code === 'auth/email-already-exists') {
       throw new HttpsError('already-exists',
         'A user with this email already exists');
     }
     if (error.code === 'auth/invalid-password') {
       throw new HttpsError('invalid-argument',
         'Password must be at least 6 characters');
     }
     throw new HttpsError('internal', 
       'Failed to create user: ' + error.message);
  }
});


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
    // Get user data before deleting
    const userDoc = await admin.firestore()
      .doc('users/' + userId).get();
    const userData = userDoc.data();

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Delete from Firestore users collection
    await admin.firestore().doc('users/' + userId).delete();

    // If client, delete from clients collection too
    if (userData?.role === 'client') {
      await admin.firestore().doc('clients/' + userId).delete();
    }

    return { success: true, message: 'User deleted successfully' };

  } catch (error: any) {
    console.error('deleteUser failed:', JSON.stringify({
       code: error.code,
       message: error.message,
       stack: error.stack,
    }));
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});
