'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const SendPushNotificationSchema = z.object({
  tokens: z.array(z.string()).describe('FCM device tokens to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body content of the notification.'),
  url: z.string().describe('The URL to open when the notification is clicked.'),
});

// App Hosting automatically initializes the Admin SDK.
// Explicit initialization is not needed and can cause crashes.
try {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
} catch (e) {
    console.log('Firebase Admin SDK already initialized.');
}


export const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: SendPushNotificationSchema,
    outputSchema: z.void(),
  },
  async ({ tokens, title, body, url }) => {
    if (tokens.length === 0) {
      console.log('No FCM tokens provided, skipping push notification.');
      return;
    }

    const message = {
      tokens: tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        fcm_options: {
          link: url,
        },
        notification: {
            icon: '/icons/icon-192x192.png',
        }
      },
      data: {
        url: url,
      }
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent push notifications:', response);
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
        // Here you might want to remove failed tokens from your database
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
);
