import { API_BASE } from '../config.js';
import { getUserId } from '../auth.js';

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

export function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', or 'default'
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

export async function subscribeUserToPush() {
  if (!isPushSupported()) return false;

  const userId = getUserId();
  if (!userId) return false;

  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Check existing push subscription or create dummy web push subscription token
    let subscription = await registration.pushManager?.getSubscription();
    if (!subscription && registration.pushManager) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Generic applicationServerKey fallback if vapid not present
          applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv69yViEuiBIa-Ib9'),
        }).catch(() => null);
      } catch (subErr) {
        console.log('Native pushManager subscribe fallback:', subErr);
      }
    }

    const payload = subscription ? subscription.toJSON() : { endpoint: 'browser-notification-' + userId, keys: {} };

    // Send subscription to backend
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: payload,
      }),
    });

    localStorage.setItem('push_opt_in_choice', 'enabled');
    return true;
  } catch (err) {
    console.error('Failed to subscribe user to push:', err);
    return false;
  }
}

export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return false;
  const userId = getUserId();

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration) {
      const subscription = await registration.pushManager?.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    if (userId) {
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    }

    localStorage.setItem('push_opt_in_choice', 'disabled');
    return true;
  } catch (err) {
    console.error('Failed to unsubscribe from push:', err);
    return false;
  }
}

export async function requestPushPermissionAndEnable() {
  if (!isPushSupported()) return 'unsupported';

  // Explicit OS-level permission request called ONLY after user consent
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await subscribeUserToPush();
  } else if (permission === 'denied') {
    localStorage.setItem('push_opt_in_choice', 'disabled');
  }
  return permission;
}

export function showLocalPushNotification(title, options = {}) {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        ...options,
      });
    });
  } else {
    try {
      new Notification(title, {
        icon: '/favicon.svg',
        ...options,
      });
    } catch (e) {
      console.log('Local notification failed:', e);
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
