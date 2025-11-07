
'use server';
/**
 * @fileOverview A flow for creating a Firebase Authentication user.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const CreateUserAccountSchema = z.object({
  email: z.string().email().describe('The email address for the new user.'),
  password: z.string().min(6).describe('The password for the new user.'),
  displayName: z.string().describe('The display name for the new user.'),
  role: z.enum(['admin', 'team', 'client']).describe('The role of the new user.'),
});

export type CreateUserAccountInput = z.infer<typeof CreateUserAccountSchema>;

// Helper function to initialize the Firebase Admin SDK securely.
async function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }
  try {
    // This will use the service account from the environment
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization error:', e);
    // If this fails, it's a fundamental configuration issue.
    throw new Error('Could not initialize Firebase Admin SDK. Service account credentials may be missing or invalid.');
  }
}

export const createUserAccountFlow = ai.defineFlow(
  {
    name: 'createUserAccountFlow',
    inputSchema: CreateUserAccountSchema,
    outputSchema: z.object({
      uid: z.string(),
      email: z.string(),
      displayName: z.string(),
    }),
  },
  async ({ email, password, displayName, role }) => {
    // Ensure the Admin SDK is initialized before proceeding.
    await initializeFirebaseAdmin();
    
    try {
      // Create the user in Firebase Authentication.
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        disabled: false,
      });

      // Set a custom claim for the user's role, critical for security rules.
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      // Return the details of the newly created user.
      return {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
      };
    } catch (error: any) {
      console.error('Error creating new user:', error);
      // Provide more specific error messages for common issues.
      if (error.code === 'auth/email-already-exists') {
        throw new Error('A user with this email address already exists.');
      }
       if (error.code === 'auth/invalid-password') {
        throw new Error('The password must be a string with at least six characters.');
      }
      // For other errors, re-throw a generic message.
      throw new Error('An unexpected error occurred while creating the user account.');
    }
  }
);

// Export a wrapper function for easier client-side consumption.
export async function createUserAccount(input: CreateUserAccountInput) {
    return await createUserAccountFlow(input);
}
