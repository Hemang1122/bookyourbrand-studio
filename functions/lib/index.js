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
exports.deleteUser = exports.createUser = exports.sendProjectCompletionEmail = exports.onUserDocCreated = exports.syncUserToFirestore = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const sync_user_1 = require("./sync-user");
Object.defineProperty(exports, "syncUserToFirestore", { enumerable: true, get: function () { return sync_user_1.syncUserToFirestore; } });
const email_service_1 = require("./email-service");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Triggered when a new user document is created in Firestore.
 * Automatically sends a welcome email with generated credentials.
 */
exports.onUserDocCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    var _a;
    const userData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!userData || !userData.email)
        return;
    console.log('🔔 New user created trigger for:', userData.email);
    try {
        const emailResult = await (0, email_service_1.sendWelcomeEmail)({
            to: userData.realEmail || userData.email,
            name: userData.name || 'User',
            email: userData.email,
            password: userData.tempPassword || 'BookYourBrands@123',
            loginUrl: 'https://bybcrm.bookyourbrands.com/login'
        });
        if (emailResult.success) {
            console.log('✅ Welcome email sent successfully to:', userData.email);
        }
        else {
            console.error('❌ Welcome email failed:', emailResult.error);
        }
    }
    catch (error) {
        console.error('❌ Error in onUserDocCreated trigger:', error);
    }
});
/**
 * Callable function to send an email to the client when a project is completed.
 */
exports.sendProjectCompletionEmail = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { clientEmail, clientName, projectName, projectUrl } = request.data;
    if (!clientEmail || !projectName) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        const result = await (0, email_service_1.sendProjectCompletedEmail)({
            to: clientEmail,
            clientName: clientName || 'Valued Client',
            projectName,
            projectUrl: projectUrl || 'https://bybcrm.bookyourbrands.com/projects'
        });
        return result;
    }
    catch (error) {
        console.error('Error sending project completion email:', error);
        throw new https_1.HttpsError('internal', 'Failed to send email: ' + error.message);
    }
});
/**
 * Callable function to create a new user (team/client).
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
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    const domain = role === 'client' ? 'creative.co' : 'example.com';
    const email = `${cleanName}@${domain}`;
    const password = `${firstName}@1234`;
    try {
        // Step 1: Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });
        const uid = userRecord.uid;
        const userDocData = {
            id: uid,
            uid: uid,
            name: name,
            email: email,
            username: cleanName,
            role: role === 'client' ? 'client' : 'team',
            avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
            isOnline: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            tempPassword: password,
        };
        if (realEmail) {
            userDocData.realEmail = realEmail;
        }
        // Step 2: Create Firestore User Document
        await db.doc('users/' + uid).set(userDocData);
        // Step 3: If client, create Client document
        if (role === 'client') {
            const clientRef = db.collection('clients').doc(uid);
            const clientDocData = {
                id: uid,
                name: name,
                email: email,
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
            await clientRef.set(clientDocData);
        }
        return {
            success: true,
            uid: uid,
            email: email,
            password: password,
            message: name + ' created successfully. Welcome email triggered.',
        };
    }
    catch (error) {
        console.error('createUser failed:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'A user with this email already exists');
        }
        throw new https_1.HttpsError('internal', 'Failed to create user: ' + error.message);
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
        // Delete from Auth
        await admin.auth().deleteUser(userId);
        // Delete from Firestore users
        await db.doc('users/' + userId).delete();
        // Delete from Firestore clients if role was client
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