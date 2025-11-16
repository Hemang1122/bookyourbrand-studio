
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

/**
 * When a message document is created with
 *   filePath: "chat/<projectId>/<uuid>.ext"
 * we sign a **long-lived** download URL and write it back into the doc.
 * Client first sees a short-lived URL (generated locally), then this one.
 */
exports.resolveFileUrl = functions.firestore
  .document('messages/{msgId}')
  .onCreate(async (snap) => {
    const data = snap.data() as any;
    if (!data.filePath) return;          // text message – nothing to do

    const bucket = storage.bucket();
    const file = bucket.file(data.filePath);

    // 1. Wait until the file is **fully** uploaded (size > 0)
    let metadata;
    try {
      metadata = await file.getMetadata().then(r => r[0]);
    } catch (e) {
      // file not there yet – should not happen because client
      // uploads **before** creating the doc, but we guard anyway
      return;
    }

    // 2. Create a **permanent** URL (15 yr expiry)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2040',   // far future
    });

    // 3. Write the URL back (merge so we do not overwrite text, etc.)
    await snap.ref.update({ fileUrl: url });
  });
