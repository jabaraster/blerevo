// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    authDomain: "blade-and-soul-field-bos-c21bf.firebaseapp.com",
    databaseURL: "https://blade-and-soul-field-bos-c21bf.firebaseio.com",
    projectId: "blade-and-soul-field-bos-c21bf",
    storageBucket: "blade-and-soul-field-bos-c21bf.appspot.com",
    messagingSenderId: "176293133121",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    measurementId: "G-2YYBYEEG7G"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
});