"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createUser = exports.onUserDocCreated = exports.onNotificationCreated = exports.syncUserToFirestore = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const sync_user_1 = require("./sync-user");
Object.defineProperty(exports, "syncUserToFirestore", { enumerable: true, get: function () { return sync_user_1.syncUserToFirestore; } });
const nodemailer = __importStar(require("nodemailer"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// ─── Email Transporter ───────────────────────────────────────────────────────
// Note: Secrets are injected via the function signature and accessed via process.env
const getTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // Gmail App Password
    },
});
// ─── Email Templates ─────────────────────────────────────────────────────────
const notificationEmailTemplate = (recipientName, message, url) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Notification</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13131F;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding:0;">
              <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                  BookYourBrands
                </h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                  Studio CRM Notification
                </p>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Hey ${recipientName},
              </p>
              <h2 style="margin:0 0 24px;color:#fff;font-size:20px;font-weight:700;line-height:1.4;">
                You have a new notification
              </h2>
              
              <!-- Notification Card -->
              <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:20px 24px;margin-bottom:32px;">
                <p style="margin:0;color:#E2E8F0;font-size:15px;line-height:1.6;">
                  ${message}
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" 
                       style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                      View in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;text-align:center;line-height:1.6;">
                You're receiving this because you're offline on BookYourBrands CRM.<br>
                Log in to manage your notifications and preferences.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
// ─── Notification Email Trigger ───────────────────────────────────────────────
exports.onNotificationCreated = (0, firestore_1.onDocumentCreated)({ document: 'notifications/{notificationId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a;
    const notification = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!notification)
        return;
    const db = admin.firestore();
    const rtdb = admin.database();
    const { message, recipients, url, type } = notification;
    if (!recipients || recipients.length === 0)
        return;
    // Process each recipient
    const emailPromises = recipients.map(async (recipientId) => {
        try {
            // 1. Check online status in Realtime Database (presence system)
            const presenceSnap = await rtdb.ref(`status/${recipientId}`).get();
            const presence = presenceSnap.val();
            // If user is online, skip email
            if ((presence === null || presence === void 0 ? void 0 : presence.isOnline) === true) {
                console.log(`⏭️ Skipping email for ${recipientId} — currently online`);
                return;
            }
            // 2. Get user data to find their real email
            const userDoc = await db.doc(`users/${recipientId}`).get();
            const userData = userDoc.data();
            if (!userData)
                return;
            // Use realEmail if available, otherwise fall back to login email
            const toEmail = userData.realEmail || userData.email;
            // Skip sending to dummy login emails if no real email set
            if (!toEmail || toEmail.includes('@creative.co') || toEmail.includes('@example.com')) {
                if (!userData.realEmail) {
                    console.log(`⏭️ Skipping email for ${recipientId} — no real email address provided`);
                    return;
                }
            }
            const recipientName = userData.name || 'there';
            // Construct the production URL
            const dashboardUrl = `https://studio-app--studio-6449361728-f6242.us-central1.hosted.app${url}`;
            // 3. Send email
            const transporter = getTransporter();
            await transporter.sendMail({
                from: `"BookYourBrands Studio" <${process.env.GMAIL_USER}>`,
                to: toEmail,
                subject: getEmailSubject(type, message),
                html: notificationEmailTemplate(recipientName, message, dashboardUrl),
            });
            console.log(`✅ Notification email sent to ${toEmail} for user ${recipientId}`);
        }
        catch (err) {
            console.error(`❌ Failed to send email to recipient ${recipientId}:`, err);
        }
    });
    await Promise.all(emailPromises);
});
const getEmailSubject = (type, message) => {
    if (type === 'chat')
        return '💬 New message on BookYourBrands Studio';
    if (message.toLowerCase().includes('project'))
        return '📁 Project Update — BookYourBrands Studio';
    if (message.toLowerCase().includes('task'))
        return '✅ Task Update — BookYourBrands Studio';
    if (message.toLowerCase().includes('package'))
        return '📦 Package Update — BookYourBrands Studio';
    return '🔔 New Notification — BookYourBrands Studio';
};
/**
 * Triggered when a new user document is created in Firestore.
 */
exports.onUserDocCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    var _a;
    const userData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!userData || !userData.email)
        return;
    console.log('🔔 New user created document:', userData.email);
});
/**
 * Callable function to create a new user (admin/team/client).
 */
exports.createUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const db = admin.firestore();
    const callerDoc = await db.doc('users/' + request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    }
    const { name, role, realEmail, company } = request.data;
    if (!name || !role) {
        throw new https_1.HttpsError('invalid-argument', 'Name and role required');
    }
    // Generation Logic
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const cleanCompany = (company || name).toLowerCase().replace(/\s+/g, '');
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    let loginEmail = '';
    let loginPassword = '';
    if (role === 'client') {
        // Clients: companyname@creative.co / firstname@1234
        loginEmail = `${cleanCompany}@creative.co`;
        loginPassword = `${firstName}@1234`;
    }
    else {
        // Team: fullname@example.com / fullname@1234
        loginEmail = `${cleanName}@example.com`;
        loginPassword = `${cleanName}@1234`;
    }
    let uid = '';
    try {
        // Step 1: Attempt to create the user
        const userRecord = await admin.auth().createUser({
            email: loginEmail,
            password: loginPassword,
            displayName: name,
        });
        uid = userRecord.uid;
        console.log('✅ Created new Auth user:', uid);
    }
    catch (error) {
        // Step 2: Handle conflict
        if (error.code === 'auth/email-already-exists') {
            console.log('⚠️ Auth user already exists, fetching existing user...');
            const existingUser = await admin.auth().getUserByEmail(loginEmail);
            uid = existingUser.uid;
            // Update password to match the expected pattern
            await admin.auth().updateUser(uid, { password: loginPassword });
            console.log('✅ Synchronized existing Auth user:', uid);
        }
        else {
            console.error('createUser Auth failed:', error);
            throw new https_1.HttpsError('internal', 'Auth failure: ' + error.message);
        }
    }
    try {
        const userDocData = {
            id: uid,
            uid: uid,
            name: name,
            email: loginEmail,
            username: cleanName,
            role: role === 'client' ? 'client' : 'team',
            avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
            isOnline: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            tempPassword: loginPassword,
        };
        if (realEmail) {
            userDocData.realEmail = realEmail;
        }
        // Step 3: Create or update Firestore user document
        await db.doc('users/' + uid).set(userDocData, { merge: true });
        // Step 4: If client, create/update client document
        if (role === 'client') {
            const clientRef = db.collection('clients').doc(uid);
            const clientDocData = {
                id: uid,
                name: name,
                email: loginEmail,
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
            await clientRef.set(clientDocData, { merge: true });
        }
        return {
            success: true,
            uid: uid,
            email: loginEmail,
            password: loginPassword,
            message: name + ' processed successfully.',
        };
    }
    catch (error) {
        console.error('createUser Firestore failed:', error);
        throw new https_1.HttpsError('internal', 'Database failure: ' + error.message);
    }
});
/**
 * Callable function to delete a user.
 */
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const db = admin.firestore();
    const callerDoc = await db.doc('users/' + request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    }
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError('invalid-argument', 'userId required');
    }
    try {
        const userDoc = await db.doc('users/' + userId).get();
        const userData = userDoc.data();
        await admin.auth().deleteUser(userId);
        await db.doc('users/' + userId).delete();
        if ((userData === null || userData === void 0 ? void 0 : userData.role) === 'client') {
            await db.doc('clients/' + userId).delete();
        }
        return { success: true, message: 'User deleted successfully' };
    }
    catch (error) {
        console.error('deleteUser failed:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete user: ' + error.message);
    }
});
//# sourceMappingURL=index.js.map