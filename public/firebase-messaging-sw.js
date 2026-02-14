
// This file needs to be in the public directory.
// It handles background notifications for the app.

// Import the Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// IMPORTANT: Replace this with your project's Firebase configuration.
const firebaseConfig = {
  "projectId": "studio-6449361728-f6242",
  "appId": "1:372067900151:web:f47cf063e692558351d1f2",
  "storageBucket": "studio-6449361728-f6242.appspot.com",
  "apiKey": "AIzaSyBB7WY7Jt5Zz0RuRuxmb0BwNd5VWR08IPA",
  "authDomain": "studio-6449361728-f6242.firebaseapp.com",
  "measurementId": "G-DXH4MMCK56",
  "messagingSenderId": "372067900151"
};


// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', // A default icon for your notifications
    data: payload.data, // This will contain the 'url'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if a window is already open with the same URL.
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
