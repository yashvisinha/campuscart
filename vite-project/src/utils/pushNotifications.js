import { API_BASE } from '../config.js';
import { getUserId } from '../auth.js';

export function isPushSupported() {
  return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
}

export function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return typeof Notification !== 'undefined' ? Notification.permission : 'default'; // 'granted', 'denied', or 'default'
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.warn('Service Worker registration warning:', err);
    return null;
  }
}

export async function subscribeUserToPush() {
  localStorage.setItem('push_opt_in_choice', 'enabled');

  const userId = getUserId();
  if (!userId) return true;

  try {
    const registration = await registerServiceWorker();

    let subscriptionPayload = { endpoint: 'browser-' + userId, active: true };

    if (registration && registration.pushManager) {
      try {
        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          subscriptionPayload = subscription.toJSON();
        }
      } catch (e) {}
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

    // Trigger confirmation push notification
    showLocalPushNotification('Notifications Enabled! 🔔', {
      body: 'CampusCart notifications are now active on your device.',
      tag: 'welcome-notification',
    });

    return true;
  } catch (err) {
    console.error('Subscription error:', err);
    return true;
  }
}

export async function unsubscribeUserFromPush() {
  localStorage.setItem('push_opt_in_choice', 'disabled');
  const userId = getUserId();

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration && registration.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe().catch(() => {});
        }
      }
    }

    if (userId) {
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return true;
  }
}

export async function requestPushPermissionAndEnable() {
  if (typeof Notification === 'undefined') return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeUserToPush();
    } else if (permission === 'denied') {
      localStorage.setItem('push_opt_in_choice', 'disabled');
    }
    return permission;
  } catch (e) {
    console.error('Permission request failed:', e);
    return 'denied';
  }
}

export function showLocalPushNotification(title, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const notifOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    ...options,
  };

  let triggered = false;

  // Try Service Worker registration first
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg && reg.showNotification) {
        reg.showNotification(title, notifOptions);
        triggered = true;
      }
    }).catch(() => {});
  }

  // Fallback to standard Notification constructor
  setTimeout(() => {
    if (!triggered) {
      try {
        new Notification(title, notifOptions);
      } catch (e) {
        console.log('Notification API fallback:', e);
      }
    }
  }, 100);
}
