'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getApp, getApps } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebase } from '@/firebase';

let storageInstance: FirebaseStorage | null = null;

const getStorageInstance = (): FirebaseStorage => {
    if (!storageInstance) {
         try {
            // Ensure Firebase is initialized
            if (!getApps().length) {
                initializeFirebase();
            }
            const app = getApp();
            storageInstance = getStorage(app);
        } catch (e) {
            console.error("Firebase has not been initialized yet. Ensure FirebaseClientProvider is wrapping your app.", e);
            throw e;
        }
    }
    return storageInstance;
};

export const uploadFile = (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storage = getStorageInstance();
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
