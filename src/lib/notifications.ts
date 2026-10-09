import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { privateApiClient } from "@/lib/api-client";
import { getFirebaseMessaging } from "./firebase";

const DEVICE_ID_STORAGE_KEY = "storedel_device_id";
const DEVICE_TOKEN_REGISTRATION_KEY = "storedel_device_token_registration";
const NOTIFICATION_BADGE_ICON = "/icons/sdl-notification-badge.png";
const NOTIFICATION_ICON = "/icons/app-icon.png";

type DeviceTokenPayload = {
    app_version: string;
    browser: string;
    device_id: string;
    os: string;
    platform: string;
    token: string;
};

export async function enableNotifications() {
    if (!("Notification" in window)) {
        throw new Error("Notifications are not supported");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        throw new Error("Notification permission denied");
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
        throw new Error("Firebase messaging is not supported");
    }

    const serviceWorkerRegistration =
        await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/firebase-cloud-messaging-push-scope",
        });
    await waitForActiveServiceWorker(serviceWorkerRegistration);

    const token = await getToken(messaging, {
        vapidKey:
            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration,
    });

    if (!token) {
        throw new Error("Unable to generate FCM token");
    }

    return token;
}

export async function registerCurrentDeviceToken() {
    if (typeof window === "undefined") return null;

    try {
        const token = await enableNotifications();
        const payload = createDeviceTokenPayload(token);

        await privateApiClient.post("/api/device-tokens/register/", payload);
        window.localStorage.setItem(
            DEVICE_TOKEN_REGISTRATION_KEY,
            JSON.stringify({
                device_id: payload.device_id,
                token: payload.token,
                registered_at: new Date().toISOString(),
            }),
        );

        return payload;
    } catch {
        return null;
    }
}

export async function unregisterCurrentDeviceToken() {
    if (typeof window === "undefined") return;

    const deviceId = getStoredDeviceId();
    if (!deviceId) return;

    try {
        await privateApiClient.post("/api/device-tokens/unregister/", {
            device_id: deviceId,
        });
    } catch {
        // Logout must continue even if the device-token API is unavailable.
    } finally {
        window.localStorage.removeItem(DEVICE_TOKEN_REGISTRATION_KEY);
    }
}

export async function listenForForegroundNotifications() {
    if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return () => undefined;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => undefined;

    return onMessage(messaging, (payload) => {
        void showForegroundNotification(payload);
    });
}

export function getOrCreateDeviceId() {
    const existingDeviceId = getStoredDeviceId();
    if (existingDeviceId) return existingDeviceId;

    const deviceId = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);

    return deviceId;
}

function getStoredDeviceId() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
}

function createDeviceTokenPayload(token: string): DeviceTokenPayload {
    const deviceInfo = getDeviceInfo();

    return {
        ...deviceInfo,
        app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
        device_id: getOrCreateDeviceId(),
        token,
    };
}

async function showForegroundNotification(payload: MessagePayload) {
    const title =
        payload.notification?.title ||
        payload.data?.title ||
        "Storedel";
    const body =
        payload.notification?.body ||
        payload.data?.body ||
        "You have a new notification.";
    const url = getNotificationUrl(payload.data?.url);

    try {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
            body,
            icon: payload.notification?.image || NOTIFICATION_ICON,
            badge: NOTIFICATION_BADGE_ICON,
            data: {
                url,
                ...payload.data,
            },
        });
    } catch {
        const notification = new Notification(title, {
            body,
            icon: payload.notification?.image || NOTIFICATION_ICON,
            data: {
                url,
                ...payload.data,
            },
        });

        notification.onclick = () => {
            window.focus();
            window.location.assign(url);
            notification.close();
        };
    }
}

function getNotificationUrl(value: string | undefined) {
    if (!value) return "/";

    try {
        const url = new URL(value, window.location.origin);

        if (url.origin !== window.location.origin) {
            return "/";
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return "/";
    }
}

function getDeviceInfo() {
    const userAgent = navigator.userAgent;

    return {
        browser: getBrowserName(userAgent),
        os: getOperatingSystem(userAgent),
        platform: getPlatform(userAgent),
    };
}

function getBrowserName(userAgent: string) {
    if (/Edg\//.test(userAgent)) return "Edge";
    if (/OPR\//.test(userAgent)) return "Opera";
    if (/Chrome\//.test(userAgent)) return "Chrome";
    if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
    if (/Firefox\//.test(userAgent)) return "Firefox";

    return "Unknown";
}

function getOperatingSystem(userAgent: string) {
    if (/Android/.test(userAgent)) {
        const match = userAgent.match(/Android\s([\d.]+)/);
        return match ? `Android ${match[1]}` : "Android";
    }

    if (/iPhone|iPad|iPod/.test(userAgent)) {
        const match = userAgent.match(/OS\s([\d_]+)/);
        return match ? `iOS ${match[1].replaceAll("_", ".")}` : "iOS";
    }

    if (/Windows NT/.test(userAgent)) return "Windows";
    if (/Mac OS X/.test(userAgent)) return "macOS";
    if (/Linux/.test(userAgent)) return "Linux";

    return "Unknown";
}

function getPlatform(userAgent: string) {
    if (/Android/.test(userAgent)) return "android";
    if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";

    return "web";
}

function waitForActiveServiceWorker(registration: ServiceWorkerRegistration) {
    if (registration.active) {
        return Promise.resolve();
    }

    const worker = registration.installing ?? registration.waiting;

    if (!worker) {
        return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error("Firebase service worker did not become active"));
        }, 10000);

        worker.addEventListener("statechange", () => {
            if (worker.state === "activated") {
                window.clearTimeout(timeoutId);
                resolve();
            }
        });
    });
}
