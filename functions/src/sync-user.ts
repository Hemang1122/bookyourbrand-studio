import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Cloud Function to synchronize a user from Firebase Auth to Firestore.
 * This is useful for users who exist in Auth but missing documents in Firestore.
 */
export const syncUserToFirestore = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = request.auth.uid;
  const email = request.auth.token.email || '';
  // Name can be provided in request data, or default to email prefix
  const name = request.data?.name || email.split('@')[0] || 'New User';

  const db = admin.firestore();

  try {
    // Check if user doc already exists
    const userDocRef = db.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      return { success: true, message: 'User document already exists' };
    }

    // Create user document
    const userDocData = {
      id: userId,
      uid: userId,
      email: email,
      name: name,
      role: 'client',
      avatar: 'avatar-1',
      isOnline: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userDocRef.set(userDocData);

    // Also create/sync client document
    const clientDocRef = db.doc(`clients/${userId}`);
    const clientDocData = {
      id: userId,
      email: email,
      name: name,
      avatar: 'avatar-1',
      reelsCreated: 0,
      reelsLimit: 3,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await clientDocRef.set(clientDocData, { merge: true });

    return { success: true, message: 'User profile synced successfully' };
  } catch (error: any) {
    console.error('syncUserToFirestore error:', error);
    throw new HttpsError('internal', error.message || 'Unknown synchronization error');
  }
});
