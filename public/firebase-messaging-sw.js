
// In order to get background notifications to work, you have to use the compat libraries
// for the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// This config is public and can be exposed. It's the same config
// from src/firebase/config.ts
const firebaseConfig = {
  "projectId": "studio-6449361728-f6242",
  "appId": "1:372067900151:web:f47cf063e692558351d1f2",
  "storageBucket": "studio-6449361728-f6242.appspot.com",
  "apiKey": "AIzaSyBB7WY7Jt5Zz0RuRuxmb0BwNd5VWR08IPA",
  "authDomain": "studio-6449361728-f6242.firebaseapp.com",
  "measurementId": "G-DXH4MMCK56",
  "messagingSenderId": "372067900151"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
