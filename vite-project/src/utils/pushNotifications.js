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

    let subscriptionPayload = { endpoint: 'browser-' + userId, active: true };

    if (registration && registration.pushManager) {
      try {
        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          subscriptionPayload = subscription.toJSON();
        }
      } catch (e) {
        console.log('Push manager getSubscription notice:', e);
      }
    }

    // Send subscription to backend
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subscriptionPayload,
      }),
    }).catch(() => {});

    localStorage.setItem('push_opt_in_choice', 'enabled');

    // Display instant test/confirmation notification on phone
    showLocalPushNotification('Notifications Enabled! 🔔', {
      body: 'You will now receive alerts for new messages, orders, and offers.',
      tag: 'welcome-notification',
    });

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
    if (registration && registration.pushManager) {
      try {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      } catch (e) {}
    }

    if (userId) {
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
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

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeUserToPush();
    } else {
      localStorage.setItem('push_opt_in_choice', 'disabled');
    }
    return permission;
  } catch (e) {
    console.error('Permission request failed:', e);
    return 'denied';
  }
}

export function showLocalPushNotification(title, options = {}) {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const notifOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    ...options,
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, notifOptions);
    }).catch(() => {
      try { new Notification(title, notifOptions); } catch (e) {}
    });
  } else {
    try {
      new Notification(title, notifOptions);
    } catch (e) {
      console.log('Notification trigger notice:', e);
    }
  }
}
