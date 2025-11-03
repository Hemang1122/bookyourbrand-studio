'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getApp, getApps, type FirebaseApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = (
  app: FirebaseApp,
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storage = getStorage(app);
    const fileId = uuidv4();
    const storageRef = ref(storage, `${path}/${fileId}-${file.name}`);
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
