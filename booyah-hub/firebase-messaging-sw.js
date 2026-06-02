// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAso3wugbZnrTty8Aik-d-oiMZLdNq1aZE",
    authDomain: "ff-hub-b225f.firebaseapp.com",
    projectId: "ff-hub-b225f",
    storageBucket: "ff-hub-b225f.firebasestorage.app",
    messagingSenderId: "158561227588",
    appId: "1:158561227588:web:ba2726367d0d8574817d11"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background Message Received: ', payload);
    const notificationTitle = payload.notification?.title || "Booyah HUB Alert";
    const notificationOptions = {
        body: payload.notification?.body || "New update in arena!",
        icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=BooyahLogo'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});