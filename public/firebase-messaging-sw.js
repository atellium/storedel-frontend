importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyC2k5aj4HS6eWhdEmpOYydS2hbzdxgVLew",
    authDomain: "storedel.firebaseapp.com",
    projectId: "storedel",
    storageBucket: "storedel.firebasestorage.app",
    messagingSenderId: "531741918897",
    appId: "1:531741918897:web:f827d1fdbdffa59ca4c490",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Background message:", payload);

    const data = payload.data || {};

    const title = data.title || "Storedel";
    const body = data.body || "You have a new notification.";

    self.registration.showNotification(title, {
        body,
        icon: "/icons/app-icon.png",
        badge: "/icons/sdl-notification-badge.png",
        data: {
            url: data.url || "/",
            ...data,
        },
    });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients
            .matchAll({
                type: "window",
                includeUncontrolled: true,
            })
            .then((clientList) => {
                for (const client of clientList) {
                    if ("focus" in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }

                return self.clients.openWindow(url);
            })
    );
});
