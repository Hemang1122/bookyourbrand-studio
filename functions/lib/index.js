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
exports.deleteUser = exports.createUser = exports.sendProjectChatNotification = exports.sendTaskNotification = exports.sendProjectCompletionEmail = exports.onUserDocCreated = exports.onNotificationCreated = exports.onProjectUpdated = exports.onProjectChatMessageCreated = exports.onTaskUpdated = exports.onTaskCreated = exports.syncUserToFirestore = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const sync_user_1 = require("./sync-user");
Object.defineProperty(exports, "syncUserToFirestore", { enumerable: true, get: function () { return sync_user_1.syncUserToFirestore; } });
const email_service_1 = require("./email-service");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// ─── Trigger: Task Created ──────────────────────────────────────────────────
exports.onTaskCreated = (0, firestore_1.onDocumentCreated)({ document: 'tasks/{taskId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a, _b;
    const task = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!task)
        return;
    const db = admin.firestore();
    try {
        const assignedUserId = ((_b = task.assignedTo) === null || _b === void 0 ? void 0 : _b.id) || task.assignedTo;
        if (!assignedUserId)
            return;
        const userDoc = await db.doc(`users/${assignedUserId}`).get();
        const userData = userDoc.data();
        const emailTo = (userData === null || userData === void 0 ? void 0 : userData.realEmail) || (userData === null || userData === void 0 ? void 0 : userData.email);
        if (!emailTo)
            return;
        const projectDoc = await db.doc(`projects/${task.projectId}`).get();
        const projectData = projectDoc.data();
        const projectName = (projectData === null || projectData === void 0 ? void 0 : projectData.name) || 'Unknown Project';
        await (0, email_service_1.sendTaskAssignedEmail)({
            to: emailTo,
            clientName: (userData === null || userData === void 0 ? void 0 : userData.name) || 'Team Member',
            projectName,
            taskName: task.title,
            taskDescription: task.description || '',
            dueDate: task.dueDate || 'Not set',
            projectUrl: `https://bybcrm.bookyourbrands.com/projects/${task.projectId}`
        });
        console.log(`✅ Task notification background alert sent to ${emailTo}`);
    }
    catch (err) {
        console.error('❌ onTaskCreated Trigger Error:', err);
    }
});
// ─── Trigger: Task Updated (Status Change) ───────────────────────────────────
exports.onTaskUpdated = (0, firestore_1.onDocumentUpdated)({ document: 'tasks/{taskId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    // Only proceed if status has actually changed
    if (before.status === after.status)
        return;
    const db = admin.firestore();
    try {
        const assignedUserId = ((_c = after.assignedTo) === null || _c === void 0 ? void 0 : _c.id) || after.assignedTo;
        if (!assignedUserId)
            return;
        const userDoc = await db.doc(`users/${assignedUserId}`).get();
        const userData = userDoc.data();
        const emailTo = (userData === null || userData === void 0 ? void 0 : userData.realEmail) || (userData === null || userData === void 0 ? void 0 : userData.email);
        if (!emailTo)
            return;
        const projectDoc = await db.doc(`projects/${after.projectId}`).get();
        const projectData = projectDoc.data();
        const projectName = (projectData === null || projectData === void 0 ? void 0 : projectData.name) || 'Unknown Project';
        // Identify who updated the task (if possible, fallback to 'Someone')
        // Note: In Firestore triggers, we don't directly have the 'updatedBy' user ID 
        // unless it was written into the document. Our TaskRemark logic usually has this.
        const lastRemark = after.remarks && after.remarks.length > 0
            ? after.remarks[after.remarks.length - 1]
            : null;
        const updatedBy = lastRemark ? lastRemark.userName : 'a team member';
        await (0, email_service_1.sendTaskStatusUpdateEmail)({
            to: emailTo,
            clientName: (userData === null || userData === void 0 ? void 0 : userData.name) || 'Team Member',
            projectName,
            taskName: after.title,
            taskDescription: after.description || '',
            oldStatus: before.status,
            newStatus: after.status,
            updatedBy,
            projectUrl: `https://bybcrm.bookyourbrands.com/projects/${after.projectId}`
        });
        console.log(`✅ Task status notification sent to ${emailTo} (${before.status} → ${after.status})`);
    }
    catch (err) {
        console.error('❌ onTaskUpdated Trigger Error:', err);
    }
});
// ─── Trigger: Project Chat Message Created ─────────────────────────────────
exports.onProjectChatMessageCreated = (0, firestore_1.onDocumentCreated)({ document: 'projects/{projectId}/chat-messages/{messageId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a, _b;
    const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!message)
        return;
    const db = admin.firestore();
    const { projectId } = event.params;
    try {
        const projectDoc = await db.doc(`projects/${projectId}`).get();
        const projectData = projectDoc.data();
        if (!projectData)
            return;
        const recipients = [
            (_b = projectData.client) === null || _b === void 0 ? void 0 : _b.id,
            ...(projectData.team_ids || [])
        ].filter(id => id && id !== message.senderId);
        for (const recipientId of recipients) {
            const userDoc = await db.doc(`users/${recipientId}`).get();
            const userData = userDoc.data();
            const emailTo = (userData === null || userData === void 0 ? void 0 : userData.realEmail) || (userData === null || userData === void 0 ? void 0 : userData.email);
            if (emailTo) {
                await (0, email_service_1.sendProjectChatMessageEmail)({
                    to: emailTo,
                    clientName: (userData === null || userData === void 0 ? void 0 : userData.name) || 'User',
                    projectName: projectData.name,
                    senderName: message.senderName,
                    messagePreview: message.text || 'Shared a media file',
                    projectUrl: `https://bybcrm.bookyourbrands.com/projects/${projectId}?openChat=true`
                });
            }
        }
    }
    catch (err) {
        console.error('❌ onProjectChatMessageCreated Trigger Error:', err);
    }
});
// ─── Trigger: Project Updated (Completion) ──────────────────────────────────
exports.onProjectUpdated = (0, firestore_1.onDocumentUpdated)({ document: 'projects/{projectId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    if (before.status !== 'Completed' && after.status === 'Completed') {
        try {
            const clientId = (_c = after.client) === null || _c === void 0 ? void 0 : _c.id;
            if (!clientId)
                return;
            const db = admin.firestore();
            const clientDoc = await db.doc(`users/${clientId}`).get();
            const clientData = clientDoc.data();
            const emailTo = (clientData === null || clientData === void 0 ? void 0 : clientData.realEmail) || (clientData === null || clientData === void 0 ? void 0 : clientData.email);
            if (emailTo) {
                await (0, email_service_1.sendProjectCompletedEmail)({
                    to: emailTo,
                    clientName: (clientData === null || clientData === void 0 ? void 0 : clientData.name) || 'Valued Client',
                    projectName: after.name,
                    projectUrl: `https://bybcrm.bookyourbrands.com/projects/${event.params.projectId}`
                });
                console.log(`✅ Completion notification sent to ${emailTo}`);
            }
        }
        catch (err) {
            console.error('❌ onProjectUpdated Trigger Error:', err);
        }
    }
});
// ─── Existing Notification Trigger ──────────────────────────────────────────
exports.onNotificationCreated = (0, firestore_1.onDocumentCreated)({ document: 'notifications/{notificationId}', secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (event) => {
    var _a;
    const notification = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!notification)
        return;
    const db = admin.firestore();
    const rtdb = admin.database();
    const { recipients } = notification;
    if (!recipients || recipients.length === 0)
        return;
    const emailPromises = recipients.map(async (recipientId) => {
        var _a;
        try {
            const presenceSnap = await rtdb.ref(`status/${recipientId}`).get();
            const isOnline = ((_a = presenceSnap.val()) === null || _a === void 0 ? void 0 : _a.isOnline) === true;
            if (isOnline)
                return;
            const userDoc = await db.doc(`users/${recipientId}`).get();
            const userData = userDoc.data();
            const toEmail = (userData === null || userData === void 0 ? void 0 : userData.realEmail) || (userData === null || userData === void 0 ? void 0 : userData.email);
            if (!toEmail || toEmail.includes('@creative.co'))
                return;
            console.log(`✅ Generic background email sent to ${toEmail}`);
        }
        catch (err) {
            console.error(`❌ Failed to send email to ${recipientId}:`, err);
        }
    });
    await Promise.all(emailPromises);
});
// ─── Existing User Onboarding Trigger ───────────────────────────────────────
exports.onUserDocCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    var _a;
    const userData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!userData || !userData.email)
        return;
    try {
        await (0, email_service_1.sendWelcomeEmail)({
            to: userData.realEmail || userData.email,
            name: userData.name || 'User',
            email: userData.email,
            password: userData.tempPassword || 'BookYourBrands@123',
            loginUrl: 'https://bybcrm.bookyourbrands.com/login'
        });
    }
    catch (error) {
        console.error('❌ onUserDocCreated trigger error:', error);
    }
});
// ─── Callable Functions (API Endpoints) ─────────────────────────────────────
exports.sendProjectCompletionEmail = (0, https_1.onCall)({ secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, projectUrl } = request.data;
    if (!clientEmail || !projectName)
        throw new https_1.HttpsError('invalid-argument', 'Missing fields');
    return (0, email_service_1.sendProjectCompletedEmail)({ to: clientEmail, clientName, projectName, projectUrl });
});
exports.sendTaskNotification = (0, https_1.onCall)({ secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, taskName, taskDescription, dueDate, projectUrl } = request.data;
    return (0, email_service_1.sendTaskAssignedEmail)({ to: clientEmail, clientName, projectName, taskName, taskDescription, dueDate, projectUrl });
});
exports.sendProjectChatNotification = (0, https_1.onCall)({ secrets: ['GMAIL_USER', 'GMAIL_PASS'] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    const { clientEmail, clientName, projectName, senderName, messagePreview, projectUrl } = request.data;
    return (0, email_service_1.sendProjectChatMessageEmail)({ to: clientEmail, clientName, projectName, senderName, messagePreview, projectUrl });
});
exports.createUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const db = admin.firestore();
    const callerDoc = await db.doc('users/' + request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    const { name, role, realEmail, company } = request.data;
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const cleanCompany = (company || name).toLowerCase().replace(/\s+/g, '');
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    const loginEmail = role === 'client' ? `${cleanCompany}@creative.co` : `${cleanName}@example.com`;
    const loginPassword = role === 'client' ? `${firstName}@1234` : `${cleanName}@1234`;
    try {
        const userRecord = await admin.auth().createUser({ email: loginEmail, password: loginPassword, displayName: name });
        const uid = userRecord.uid;
        const userDocData = { id: uid, uid, name, email: loginEmail, username: cleanName, role: role === 'client' ? 'client' : 'team', avatar: 'avatar-' + (Math.floor(Math.random() * 3) + 1), isOnline: false, createdAt: admin.firestore.FieldValue.serverTimestamp(), tempPassword: loginPassword };
        if (realEmail)
            userDocData.realEmail = realEmail;
        await db.doc('users/' + uid).set(userDocData);
        if (role === 'client') {
            await db.doc('clients/' + uid).set({ id: uid, name, email: loginEmail, company: company || 'New Company', reelsCreated: 0, reelsLimit: 3, packageName: 'Starter', createdAt: admin.firestore.FieldValue.serverTimestamp(), realEmail: realEmail || null }, { merge: true });
        }
        return { success: true, uid, email: loginEmail, password: loginPassword };
    }
    catch (error) {
        if (error.code === 'auth/email-already-exists')
            throw new https_1.HttpsError('already-exists', 'User exists');
        throw new https_1.HttpsError('internal', error.message);
    }
});
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const db = admin.firestore();
    const callerDoc = await db.doc('users/' + request.auth.uid).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Must be an admin');
    const { userId } = request.data;
    const userDoc = await db.doc('users/' + userId).get();
    const userData = userDoc.data();
    await admin.auth().deleteUser(userId);
    await db.doc('users/' + userId).delete();
    if ((userData === null || userData === void 0 ? void 0 : userData.role) === 'client')
        await db.doc('clients/' + userId).delete();
    return { success: true };
});
//# sourceMappingURL=index.js.map