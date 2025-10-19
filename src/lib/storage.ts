
'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

let storageInstance: FirebaseStorage | null = null;

// A helper function to ensure we get the storage instance only after initialization.
const getStorageInstance = (): FirebaseStorage => {
    if (!storageInstance) {
        try {
            // This will succeed if the app is already initialized by a provider.
            const app = getApp();
            storageInstance = getStorage(app);
        } catch (e) {
            // This should not happen in the normal flow because of how the app is structured,
            // but it's a safeguard.
            console.error("Firebase has not been initialized yet. Ensure FirebaseClientProvider is wrapping your app.", e);
            throw e;
        }
    }
    return storageInstance;
};

export const uploadFile = (
  file: File,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storage = getStorageInstance(); // Get storage instance here
    const fileId = uuidv4();
    const storageRef = ref(storage, `${path}/${fileId}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
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
