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

// Initialize Firebase Admin SDK if it hasn't been already
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization error:', e);
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
    if (!admin.apps.length) {
        throw new Error("Firebase Admin SDK not initialized.");
    }
    
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        disabled: false,
      });

      // Set a custom claim for the user's role
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      return {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
      };
    } catch (error: any) {
      console.error('Error creating new user:', error);
      // Provide a more descriptive error message
      if (error.code === 'auth/email-already-exists') {
        throw new Error('A user with this email address already exists.');
      }
       if (error.code === 'auth/invalid-password') {
        throw new Error('The password must be a string with at least six characters.');
      }
      throw new Error('An unexpected error occurred while creating the user account.');
    }
  }
);

export async function createUserAccount(input: CreateUserAccountInput) {
    return await createUserAccountFlow(input);
}
