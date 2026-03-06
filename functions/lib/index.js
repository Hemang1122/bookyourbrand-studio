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
exports.deleteUser = exports.createUser = exports.onUserDocCreated = exports.syncUserToFirestore = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const sync_user_1 = require("./sync-user");
Object.defineProperty(exports, "syncUserToFirestore", { enumerable: true, get: function () { return sync_user_1.syncUserToFirestore; } });
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Triggered when a new user document is created in Firestore.
 * Currently just logs, as email dispatch is handled via the Next.js API route
 * for more granular control over templates and passwords.
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
 * Handles Firebase Auth account creation and initial Firestore doc.
 * Returns the generated credentials so the frontend can send them via email.
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
        // Step 2: Handle conflict (Conflict Resolution for testing)
        if (error.code === 'auth/email-already-exists') {
            console.log('⚠️ Auth user already exists, fetching existing user...');
            const existingUser = await admin.auth().getUserByEmail(loginEmail);
            uid = existingUser.uid;
            // Update password to match the expected pattern for consistency during testing
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