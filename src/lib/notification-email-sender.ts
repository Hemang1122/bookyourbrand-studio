import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendEmail, emailTemplates } from './email-service';

/**
 * @fileOverview Notification Email Dispatcher
 * Listens for new Firestore notifications and sends corresponding emails.
 */

// Initialize a local instance of Firebase for the background listener
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export function startNotificationEmailListener() {
  console.log('📧 Starting notification email listener...');

  const notificationsRef = collection(db, 'notifications');
  
  // Real-time listener for the notifications collection
  onSnapshot(notificationsRef, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      // Only process brand new notifications
      if (change.type === 'added') {
        const notification = change.doc.data();
        
        // Skip if email was already dispatched or if it's not a system/chat notification
        if ((notification as any).emailSent) return;

        console.log(`Processing notification: ${notification.message}`);

        // Iterate through all intended recipients
        for (const recipientId of notification.recipients || []) {
          try {
            // Resolve recipient ID to email address via Users collection
            const userDoc = await getDoc(doc(db, 'users', recipientId));
            const userData = userDoc.data();
            
            if (!userData?.email) {
              console.warn(`No email found for recipient: ${recipientId}`);
              continue;
            }

            // Construct full application URL for the call-to-action button
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bybcrm.bookyourbrands.com';
            const actionUrl = appUrl + (notification.url || '/dashboard');

            // Generate HTML content from templates
            const emailContent = emailTemplates.notification(
              userData.name || 'User',
              notification.message,
              notification.type === 'chat' ? 'New Message' : 'System Update',
              actionUrl
            );

            // Dispatch via SMTP
            await sendEmail({
              to: userData.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text
            });

            console.log(`✅ Notification email sent to: ${userData.email}`);

          } catch (error) {
            console.error(`❌ Failed to send notification email to ${recipientId}:`, error);
          }
        }

        // Mark notification as processed to prevent duplicate sends across re-renders
        try {
          await updateDoc(change.doc.ref, { emailSent: true });
        } catch (updateError) {
          console.error('Failed to mark notification as email-sent:', updateError);
        }
      }
    });
  });
}
