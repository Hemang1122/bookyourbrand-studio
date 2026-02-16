import * as admin from "firebase-admin";
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const gmailUser = defineSecret('GMAIL_USER');
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

export const createUser = onCall({ secrets: [gmailUser, gmailAppPassword] }, async (request) => {
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
    
    // Step 4: Send welcome email if realEmail is provided
    if (realEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser.value(),
          pass: gmailAppPassword.value(),
        },
      });

      const roleName = role === 'client' ? 'Client' : 'Editor';
      const portalUrl = 'https://studio--studio-6449361728-f6242.us-central1.hosted.app/login';

      const mailOptions = {
        from: `"BookYourBrands" <${gmailUser.value()}>`,
        to: realEmail,
        subject: 'Welcome to BookYourBrands CRM!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #6366f1; text-align: center;">Welcome to BookYourBrands, ${name}! 🎉</h2>
            <p>Your ${roleName} account has been created successfully. You can now log in to our portal using the credentials below.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #6366f1;">
              <p style="margin: 8px 0;"><strong>Login URL:</strong> <a href="${portalUrl}" style="color: #6366f1;">${portalUrl}</a></p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0;"><strong>Password:</strong> ${password}</p>
            </div>
            
            <p style="color: #ef4444;"><strong>Important:</strong> For your security, please change your password after your first login.</p>
            
            <p>If you have any questions, feel free to reply to this email or contact your account manager directly.</p>
            
            <p>Best regards,<br/><strong>The BookYourBrands Team</strong></p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', realEmail);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Do not fail the whole function if email fails, just log it.
      }
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
