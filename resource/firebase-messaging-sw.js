importScripts('/__/firebase/7.9.1/firebase-app.js');
importScripts('/__/firebase/7.9.1/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

firebase.initializeApp({
    messagingSenderId: "AAAAKQvju0E:APA91bF-JQoI-fsxhA1dsO5ZNi-IOUylmhM7Rqay5d0z2IYy7FcqFLSmv0BcWXZotqrdbu2lmVhOvpenK-Q86k4yRv5Rcix-RsYvMpe4PthnOzw84zEWh9HnYZKSpT288w1fbkKDySM-",
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    appName: "Blave and Revolution Field boss tracker",
    projectId: "blade-and-soul-field-bos-c21bf",
});

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});