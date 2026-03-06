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
exports.syncUserToFirestore = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Cloud Function to synchronize a user from Firebase Auth to Firestore.
 * This is useful for users who exist in Auth but missing documents in Firestore.
 */
exports.syncUserToFirestore = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const userId = request.auth.uid;
    const email = request.auth.token.email || '';
    // Name can be provided in request data, or default to email prefix
    const name = ((_a = request.data) === null || _a === void 0 ? void 0 : _a.name) || email.split('@')[0] || 'New User';
    const db = admin.firestore();
    try {
        // Check if user doc already exists
        const userDocRef = db.doc(`users/${userId}`);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            return { success: true, message: 'User document already exists' };
        }
        // Create user document
        const userDocData = {
            id: userId,
            uid: userId,
            email: email,
            name: name,
            role: 'client',
            avatar: 'avatar-1',
            isOnline: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await userDocRef.set(userDocData);
        // Also create/sync client document
        const clientDocRef = db.doc(`clients/${userId}`);
        const clientDocData = {
            id: userId,
            email: email,
            name: name,
            avatar: 'avatar-1',
            reelsCreated: 0,
            reelsLimit: 3,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await clientDocRef.set(clientDocData, { merge: true });
        return { success: true, message: 'User profile synced successfully' };
    }
    catch (error) {
        console.error('syncUserToFirestore error:', error);
        throw new https_1.HttpsError('internal', error.message || 'Unknown synchronization error');
    }
});
//# sourceMappingURL=sync-user.js.map