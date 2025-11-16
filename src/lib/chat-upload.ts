
'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
import { v4 as uuid } from 'uuid';
import { getApp } from 'firebase/app';


const generateId = () => uuid();

/**
 * WhatsApp-style upload:
 * 1. Put file in Storage immediately
 * 2. Return a **local** download URL (blob:) for instant playback / preview
 * 3. Create message doc with { filePath } only (no URL)
 * 4. Cloud Function will later write the real, long-lived URL
 */
export async function uploadChatFile(args: {
  projectId: string;
  file: File | Blob;
  contentType?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isVoice?: boolean;
}) {
  const { projectId, file, contentType, senderId, senderName, senderAvatar, isVoice } = args;

  const app = getApp();
  const storage = getStorage(app);
  const db = getFirestore(app);

  // 1. Unique path
  const ext = (file instanceof File ? file.name.split('.').pop() : 'webm') || 'webm';
  const path = `chat/${projectId}/${generateId()}.${ext}`;
  const storageRef = ref(storage, path);

  // 2. Upload (resumable – gives free progress / retry)
  const task = uploadBytesResumable(storageRef, file, contentType ? { contentType } : undefined);

  // 3. **Local** URL for instant UI
  const localUrl = URL.createObjectURL(file);

  // 4. Firestore document (no URL yet!)
  const msg: Omit<ChatMessage, 'id' | 'timestamp' | 'fileUrl'> & { filePath: string; timestamp: any } = {
    projectId,
    senderId,
    senderName,
    senderAvatar,
    message: isVoice ? '🎤 Voice message' : (file instanceof File ? file.name : 'Voice'),
    messageType: isVoice ? 'voice' : 'file',
    filePath: path,               // <- only the path
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'messages'), msg);

  // 5. Wait for upload to finish (optional – UI can ignore this)
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', null, reject, resolve);
  });

  // 6. Return both the **local** URL (for instant playback) and the doc id
  return { localUrl, docId: docRef.id };
}
