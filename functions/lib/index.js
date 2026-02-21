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
exports.onProjectStatusCompleted = exports.deleteUser = exports.createUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const nodemailer = __importStar(require("nodemailer"));
const firestore_1 = require("firebase-functions/v2/firestore");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const gmailUser = (0, params_1.defineSecret)('GMAIL_USER');
const gmailAppPassword = (0, params_1.defineSecret)('GMAIL_APP_PASSWORD');
exports.createUser = (0, https_1.onCall)({ secrets: [gmailUser, gmailAppPassword] }, async (request) => {
    var _a;
    // Verify caller is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    // Verify caller is an admin by checking Firestore
    const callerDoc = await admin.firestore()
        .doc('users/' + request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    }
    const { name, role, realEmail } = request.data;
    if (!name || !role) {
        throw new https_1.HttpsError('invalid-argument', 'Name and role required');
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
        const userDocData = {
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
            const clientDocData = {
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
            const portalUrl = 'https://studio-app--studio-6449361728-f6242.us-central1.hosted.app/login';
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
            }
            catch (emailError) {
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
    }
    catch (error) {
        console.error('createUser failed:', JSON.stringify({
            code: error.code,
            message: error.message,
            stack: error.stack,
        }));
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'A user with this email already exists');
        }
        if (error.code === 'auth/invalid-password') {
            throw new https_1.HttpsError('invalid-argument', 'Password must be at least 6 characters');
        }
        throw new https_1.HttpsError('internal', 'Failed to create user: ' + error.message);
    }
});
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const callerDoc = await admin.firestore()
        .doc('users/' + request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    }
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError('invalid-argument', 'userId required');
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
        if ((userData === null || userData === void 0 ? void 0 : userData.role) === 'client') {
            await admin.firestore().doc('clients/' + userId).delete();
        }
        return { success: true, message: 'User deleted successfully' };
    }
    catch (error) {
        console.error('deleteUser failed:', JSON.stringify({
            code: error.code,
            message: error.message,
            stack: error.stack,
        }));
        throw new https_1.HttpsError('internal', 'Failed to delete user: ' + error.message);
    }
});
exports.onProjectStatusCompleted = (0, firestore_1.onDocumentUpdated)({ document: 'projects/{projectId}', secrets: [gmailUser, gmailAppPassword] }, async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    // Only trigger when status changes TO "Completed"
    if ((before === null || before === void 0 ? void 0 : before.status) === (after === null || after === void 0 ? void 0 : after.status) || (after === null || after === void 0 ? void 0 : after.status) !== 'Completed') {
        return;
    }
    const projectId = event.params.projectId;
    const projectName = after === null || after === void 0 ? void 0 : after.name;
    const clientId = (_c = after === null || after === void 0 ? void 0 : after.client) === null || _c === void 0 ? void 0 : _c.id;
    if (!clientId) {
        console.log('No client ID found for project:', projectId);
        return;
    }
    const db = admin.firestore();
    // Get client's real email
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
        console.log('Client document not found:', clientId);
        return;
    }
    const clientData = clientDoc.data();
    const realEmail = clientData === null || clientData === void 0 ? void 0 : clientData.realEmail;
    if (!realEmail) {
        console.log('No real email for client:', clientId);
        return;
    }
    // Send email
    const mailOptions = {
        from: `"BookYourBrands" <${gmailUser.value()}>`,
        to: realEmail,
        subject: `🎬 Your Reel is Ready for Review — ${projectName}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width">
        </head>
        <body style="margin:0;padding:0;background:#0F0F1A;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#C084FC,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                BookYourBrands
              </h1>
              <p style="color:#9CA3AF;margin:8px 0 0;">Your Creative Studio</p>
            </div>
            <div style="background:#13131F;border-radius:20px;padding:40px;border:1px solid rgba(124,58,237,0.2);">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:rgba(124,58,237,0.15);border-radius:50%;padding:20px;border:2px solid rgba(124,58,237,0.3);">
                  <span style="font-size:40px;">🎬</span>
                </div>
              </div>
              <h2 style="color:white;font-size:24px;text-align:center;margin:0 0 8px;">Your Reel is Ready!</h2>
              <p style="color:#9CA3AF;text-align:center;margin:0 0 32px;font-size:16px;">
                <strong style="color:#C084FC;">${projectName}</strong> has been completed by our team.
              </p>
              <p style="color:#D1D5DB;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Hi there! 👋 Great news — your reel is polished and ready for your review. Please watch it carefully. To request any changes, please get in touch with our support team and let them know what you'd like changed.
              </p>
              <p style="color:#6B7280;font-size:13px;text-align:center;margin:0;">
                If you have questions, reply to this email.
              </p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <p style="color:#4B5563;font-size:13px;margin:0;">© 2026 BookYourBrands. All rights reserved.</p>
              <p style="color:#4B5563;font-size:12px;margin:8px 0 0;">
                Founded by <span style="color:#9CA3AF;">Arpit Lalani</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser.value(),
            pass: gmailAppPassword.value(),
        },
    });
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to ${realEmail} for project ${projectName}`);
    }
    catch (error) {
        console.error('Failed to send approval email:', error);
    }
});
//# sourceMappingURL=index.js.map