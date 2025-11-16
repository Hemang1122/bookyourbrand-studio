
'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadMetadata } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File | Blob,
  path: string,
  fileName?: string,
  contentType?: string
): Promise<string> {
  const app = getApp();
  const storage = getStorage(app);
  const name = fileName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const storageRef = ref(storage, `${path}/${name}`);

  const metadata = contentType ? { contentType } : undefined;
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
