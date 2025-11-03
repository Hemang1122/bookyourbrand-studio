'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { type FirebaseApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

// This function now requires the initialized FirebaseApp to ensure correct storage context.
export const uploadFile = (
  app: FirebaseApp,
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // getStorage is now called with the passed-in app instance.
    const storage = getStorage(app);
    const fileId = uuidv4();
    const fileName = file instanceof File ? file.name : 'voice-message.webm';
    const storageRef = ref(storage, `${path}/${fileId}-${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};
