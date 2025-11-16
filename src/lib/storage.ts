'use client';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadMetadata } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = (
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void,
  contentType?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const storage = getStorage(app);

    storage.maxUploadRetryTime = 10 * 60 * 1000;

    const fileName = file instanceof File ? file.name : `${uuidv4()}.webm`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    const metadata: UploadMetadata = {};
    if (contentType) {
        metadata.contentType = contentType;
    } else if (file instanceof File) {
        metadata.contentType = file.type;
    }

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

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
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Failed to get download URL:', error);
          reject(error);
        }
      }
    );
  });
};
