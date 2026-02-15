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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in Object.keys(mod)) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
exports.createUser = (0, https_1.onCall)(async (request) => {
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
    const { name, role } = request.data;
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
        // Step 2: Create Firestore user document
        await admin.firestore().doc('users/' + userRecord.uid).set({
            id: userRecord.uid,
            uid: userRecord.uid,
            name: name,
            email: email,
            role: role === 'client' ? 'client' : 'team',
            avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1),
            isOnline: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Step 3: If client, create client document too
        if (role === 'client') {
            const clientRef = admin.firestore()
                .collection('clients').doc(userRecord.uid);
            await clientRef.set({
                id: userRecord.uid,
                name: name,
                email: email,
                avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 2),
                reelsCreated: 0,
                reelsLimit: 3,
                packageName: 'Starter',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
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
//# sourceMappingURL=index.js.map
