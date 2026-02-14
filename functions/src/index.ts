
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// The URL of your deployed Next.js application.
// IMPORTANT: You will need to set this in your function's environment variables.
const APP_URL = functions.config().app?.url || "http://localhost:9002";


/**
 * This function handles the OAuth callback from Meta (Facebook/Instagram).
 * It exchanges the authorization code for an access token, fetches the necessary
 * page and Instagram account IDs, and stores them securely in Firestore.
 */
export const metaOAuthCallback = functions.https.onRequest(async (req, res) => {
  functions.logger.info("metaOAuthCallback received a request.", {
    url: req.originalUrl,
    query: req.query,
    headers: req.headers,
  });

  const code = req.query.code as string;
  const clientId = req.query.state as string;

  // --- Step 1: Validate the incoming request ---
  if (!code || !clientId) {
    functions.logger.error("Missing 'code' or 'state' (clientId) in request.", {query: req.query});
    res.redirect(`${APP_URL}/settings?error=invalid_request&error_description=Missing required parameters.`);
    return;
  }

  // --- Step 2: Get Meta App credentials from environment variables ---
  // IMPORTANT: Set these using the Firebase CLI before deploying.
  const {app_id: appId, app_secret: appSecret} = functions.config().meta || {};
  if (!appId || !appSecret) {
    functions.logger.error("Meta App ID or App Secret is not configured in environment variables.");
    res.redirect(`${APP_URL}/settings?error=config_error&error_description=Server configuration is incomplete.`);
    return;
  }

  const redirectUri = `https://${process.env.GCLOUD_PROJECT}.cloudfunctions.net/metaOAuthCallback`;

  try {
    // --- Step 3: Exchange the authorization code for a User Access Token ---
    const tokenResponse = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
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
    const accountsResponse = await axios.get("https://graph.facebook.com/v18.0/me/accounts", {
      params: {access_token: userAccessToken},
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

    const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: "instagram_business_account",
        access_token: pageAccessToken,
      },
    });

    const igBusinessAccountId = igAccountResponse.data.instagram_business_account?.id;
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
  } catch (error: any) {
    functions.logger.error("Error during Meta OAuth callback:", error.response?.data || error.message);
    res.redirect(`${APP_URL}/settings?error=token_exchange_failed&error_description=${error.message}`);
  }
});


// --- Cloud Functions for Push Notifications ---

const MAX_MESSAGE_LENGTH = 100;

/**
 * Fetches FCM tokens for a list of user IDs.
 */
async function getFcmTokens(userIds: string[]): Promise<{ [userId: string]: string[] }> {
  const tokensMap: { [userId: string]: string[] } = {};
  if (userIds.length === 0) return tokensMap;
  
  const userDocs = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();

  userDocs.forEach(doc => {
    const userData = doc.data();
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens) && userData.fcmTokens.length > 0) {
      tokensMap[doc.id] = userData.fcmTokens;
    }
  });

  return tokensMap;
}

/**
 * Handles sending notifications and cleaning up invalid tokens.
 */
async function sendNotifications(tokensMap: { [userId: string]: string[] }, payload: admin.messaging.MessagingPayload) {
  const tokensToRemove: { [userId: string]: string[] } = {};
  const allTokens: string[] = Object.values(tokensMap).flat();
  
  if (allTokens.length === 0) return;

  const response = await admin.messaging().sendEach(
      allTokens.map(token => ({ ...payload, token }))
  );

  response.responses.forEach((result, index) => {
    const token = allTokens[index];
    if (!result.success) {
      functions.logger.error(`Failed to send message to token: ${token}`, result.error);
      
      const errorCode = result.error.code;
      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token'
      ) {
        // Find which user this token belongs to and queue it for removal
        for (const userId in tokensMap) {
          if (tokensMap[userId].includes(token)) {
            if (!tokensToRemove[userId]) {
              tokensToRemove[userId] = [];
            }
            tokensToRemove[userId].push(token);
            break;
          }
        }
      }
    }
  });

  // Clean up invalid tokens from Firestore
  const cleanupPromises = Object.entries(tokensToRemove).map(([userId, tokens]) => {
    return db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens)
    });
  });

  await Promise.allSettled(cleanupPromises);
}


export const onSupportMessageCreate = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
    try {
        const snap = event.data;
        if (!snap) {
            functions.logger.log("No data associated with the event");
            return;
        }
        const message = snap.data();
        const { chatId } = event.params;

        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) {
            functions.logger.error(`Chat document ${chatId} not found`);
            return;
        }
        const chatData = chatDoc.data()!;

        const recipients = chatData.participants.filter((pId: string) => pId !== message.senderId);
        if (recipients.length === 0) return;
        
        const tokensMap = await getFcmTokens(recipients);
        
        const payload = {
            notification: {
                title: message.senderName,
                body: message.text?.substring(0, MAX_MESSAGE_LENGTH) || 'Sent a file.',
            },
            webpush: {
                fcmOptions: { link: '/support' }
            },
            data: {
                chatId: chatId,
                type: 'support',
                url: '/support'
            }
        };

        await sendNotifications(tokensMap, payload);

    } catch (error) {
        functions.logger.error("Error in onSupportMessageCreate:", error);
    }
});


export const onProjectMessageCreate = onDocumentCreated('projects/{projectId}/chat/messages/{messageId}', async (event) => {
    try {
        const snap = event.data;
        if (!snap) {
            functions.logger.log("No data associated with the event");
            return;
        }
        const message = snap.data();
        const { projectId } = event.params;

        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) {
            functions.logger.error(`Project document ${projectId} not found`);
            return;
        }
        const projectData = projectDoc.data()!;

        const allParticipantIds = [...(projectData.team_ids || []), projectData.client.id];
        const recipients = allParticipantIds.filter((pId: string) => pId !== message.senderId);

        if (recipients.length === 0) return;

        const tokensMap = await getFcmTokens(recipients);
        
        const url = `/projects/${projectId}?tab=chat`;

        const payload = {
            notification: {
                title: `${message.senderName} in ${projectData.name}`,
                body: message.text?.substring(0, MAX_MESSAGE_LENGTH) || 'Sent a file.',
            },
            webpush: {
                fcmOptions: { link: url }
            },
            data: {
                projectId: projectId,
                type: 'project',
                url: url
            }
        };

        await sendNotifications(tokensMap, payload);

    } catch (error) {
        functions.logger.error("Error in onProjectMessageCreate:", error);
    }
});
