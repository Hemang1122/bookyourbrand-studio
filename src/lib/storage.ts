'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, setMaxUploadRetryTime } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = (
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const storage = getStorage(app);

    // Increase the maximum time allowed for uploads to 10 minutes (600,000 milliseconds)
    // This helps prevent timeouts on slow connections or with large files.
    setMaxUploadRetryTime(storage, 10 * 60 * 1000);

    const fileName = file instanceof File ? file.name : 'voice-message.webm';
    const storageRef = ref(storage, `${path}/${uuidv4()}-${fileName}`);
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
