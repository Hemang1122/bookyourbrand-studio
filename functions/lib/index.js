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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.onProjectMessageCreated = exports.onSupportMessageCreated = exports.metaOAuthCallback = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const firestore_1 = require("firebase-functions/v2/firestore");
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// The URL of your deployed Next.js application.
// IMPORTANT: You will need to set this in your function's environment variables.
const APP_URL = ((_a = functions.config().app) === null || _a === void 0 ? void 0 : _a.url) || "http://localhost:9002";
/**
 * This function handles the OAuth callback from Meta (Facebook/Instagram).
 * It exchanges the authorization code for an access token, fetches the necessary
 * page and Instagram account IDs, and stores them securely in Firestore.
 */
exports.metaOAuthCallback = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    functions.logger.info("metaOAuthCallback received a request.", {
        url: req.originalUrl,
        query: req.query,
        headers: req.headers,
    });
    const code = req.query.code;
    const clientId = req.query.state;
    // --- Step 1: Validate the incoming request ---
    if (!code || !clientId) {
        functions.logger.error("Missing 'code' or 'state' (clientId) in request.", { query: req.query });
        res.redirect(`${APP_URL}/settings?error=invalid_request&error_description=Missing required parameters.`);
        return;
    }
    // --- Step 2: Get Meta App credentials from environment variables ---
    // IMPORTANT: Set these using the Firebase CLI before deploying.
    const { app_id: appId, app_secret: appSecret } = functions.config().meta || {};
    if (!appId || !appSecret) {
        functions.logger.error("Meta App ID or App Secret is not configured in environment variables.");
        res.redirect(`${APP_URL}/settings?error=config_error&error_description=Server configuration is incomplete.`);
        return;
    }
    const redirectUri = `https://${process.env.GCLOUD_PROJECT}.cloudfunctions.net/metaOAuthCallback`;
    try {
        // --- Step 3: Exchange the authorization code for a User Access Token ---
        const tokenResponse = await axios_1.default.get("https://graph.facebook.com/v18.0/oauth/access_token", {
            params: {
                "client_id": appId,
                "redirect_uri": redirectUri,
                "client_secret": appSecret,
                "code": code,
            },
        });
        const userAccessToken = tokenResponse.data.access_token;
        if (!userAccessToken) {
            throw new Error("Failed to retrieve user access token.");
        }
        // --- Step 4: Use the User Access Token to get a list of the user's Facebook Pages ---
        const accountsResponse = await axios_1.default.get("https://graph.facebook.com/v18.0/me/accounts", {
            params: { access_token: userAccessToken },
        });
        const pages = accountsResponse.data.data;
        if (!pages || pages.length === 0) {
            res.redirect(`${APP_URL}/settings?error=no_pages_found&error_description=No Facebook Pages are associated with this account.`);
            return;
        }
        // --- Step 5: Use the first page and its token to get the linked Instagram Account ---
        const firstPage = pages[0];
        const pageAccessToken = firstPage.access_token;
        const pageId = firstPage.id;
        const pageName = firstPage.name;
        const igAccountResponse = await axios_1.default.get(`https://graph.facebook.com/v18.0/${pageId}`, {
            params: {
                fields: "instagram_business_account",
                access_token: pageAccessToken,
            },
        });
        const igBusinessAccountId = (_a = igAccountResponse.data.instagram_business_account) === null || _a === void 0 ? void 0 : _a.id;
        if (!igBusinessAccountId) {
            res.redirect(`${APP_URL}/settings?error=no_ig_account&error_description=The selected Facebook Page is not linked to an Instagram Business Account.`);
            return;
        }
        // --- Step 6: Store the credentials securely in Firestore ---
        const clientRef = db.collection("clients").doc(clientId);
        await clientRef.update({
            "social.instagram.connected": true,
            "social.instagram.pageId": pageId,
            "social.instagram.pageName": pageName,
            "social.instagram.userId": igBusinessAccountId,
            "social.instagram.accessToken": pageAccessToken, // You should encrypt this in a real production app
            "social.instagram.connectedAt": admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Successfully connected Instagram for client: ${clientId}`);
        // --- Step 7: Redirect the user back to the app with a success message ---
        res.redirect(`${APP_URL}/settings?instagram=connected`);
    }
    catch (error) {
        functions.logger.error("Error during Meta OAuth callback:", ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        res.redirect(`${APP_URL}/settings?error=token_exchange_failed&error_description=${error.message}`);
    }
});
// --- Cloud Functions for Push Notifications ---
const MAX_MESSAGE_LENGTH = 100;
exports.onSupportMessageCreated = (0, firestore_1.onDocumentCreated)('chats/{chatId}/messages/{messageId}', async (event) => {
    var _a;
    try {
        const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!message) {
            functions.logger.log("No data associated with the event");
            return;
        }
        const chatSnap = await admin.firestore().doc(`chats/${event.params.chatId}`).get();
        const chat = chatSnap.data();
        if (!chat) {
            functions.logger.error(`Chat document ${event.params.chatId} not found`);
            return;
        }
        const recipients = (chat.participants || []).filter((uid) => uid !== message.senderId);
        if (recipients.length === 0)
            return;
        const sends = recipients.map(async (uid) => {
            var _a;
            const userSnap = await admin.firestore().doc(`users/${uid}`).get();
            const fcmTokens = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.fcmTokens;
            if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0)
                return;
            const payload = {
                notification: {
                    title: message.senderName || 'New Message',
                    body: (message.text || 'Sent an attachment').substring(0, MAX_MESSAGE_LENGTH),
                },
                data: {
                    chatId: event.params.chatId,
                    type: 'support',
                    url: '/support',
                },
                webpush: {
                    fcmOptions: { link: '/support' },
                },
            };
            const tokensToRemove = [];
            const sendToTokens = fcmTokens.map(async (token) => {
                try {
                    await admin.messaging().send(Object.assign(Object.assign({}, payload), { token }));
                }
                catch (err) {
                    functions.logger.error(`Error sending to token ${token} for user ${uid}`, err);
                    if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
                        tokensToRemove.push(token);
                    }
                }
            });
            await Promise.all(sendToTokens);
            if (tokensToRemove.length > 0) {
                await userSnap.ref.update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
                });
            }
        });
        await Promise.allSettled(sends);
    }
    catch (err) {
        functions.logger.error('onSupportMessageCreated error:', err);
    }
});
exports.onProjectMessageCreated = (0, firestore_1.onDocumentCreated)('projects/{projectId}/chat/messages/{messageId}', async (event) => {
    var _a, _b;
    try {
        const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!message) {
            functions.logger.log("No data associated with the event");
            return;
        }
        const projectSnap = await admin.firestore().doc(`projects/${event.params.projectId}`).get();
        const project = projectSnap.data();
        if (!project) {
            functions.logger.error(`Project document ${event.params.projectId} not found`);
            return;
        }
        const allRecipients = [...(project.team_ids || []), (_b = project.client) === null || _b === void 0 ? void 0 : _b.id].filter(Boolean);
        const recipients = allRecipients.filter((uid) => uid !== message.senderId);
        if (recipients.length === 0)
            return;
        const url = `/projects/${event.params.projectId}?tab=chat`;
        const sends = recipients.map(async (uid) => {
            var _a;
            const userSnap = await admin.firestore().doc(`users/${uid}`).get();
            const fcmTokens = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.fcmTokens;
            if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0)
                return;
            const payload = {
                notification: {
                    title: `${message.senderName} in ${project.name}`,
                    body: (message.text || 'Sent an attachment').substring(0, MAX_MESSAGE_LENGTH),
                },
                data: {
                    projectId: event.params.projectId,
                    type: 'project',
                    url: url,
                },
                webpush: {
                    fcmOptions: { link: url },
                },
            };
            const tokensToRemove = [];
            const sendToTokens = fcmTokens.map(async (token) => {
                try {
                    await admin.messaging().send(Object.assign(Object.assign({}, payload), { token }));
                }
                catch (err) {
                    functions.logger.error(`Error sending to token ${token} for user ${uid}`, err);
                    if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
                        tokensToRemove.push(token);
                    }
                }
            });
            await Promise.all(sendToTokens);
            if (tokensToRemove.length > 0) {
                await userSnap.ref.update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
                });
            }
        });
        await Promise.allSettled(sends);
    }
    catch (err) {
        functions.logger.error('onProjectMessageCreated error:', err);
    }
});
//# sourceMappingURL=index.js.map