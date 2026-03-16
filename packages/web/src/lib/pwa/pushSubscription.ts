import { buildApiUrl } from '../api/url';
import { getValidAccessToken } from '../auth/session';

/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if push notifications are supported in the browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current push notification permission status
 */
export function getPushNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request push notification permission from user
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    // Check permission
    let permission = getPushNotificationPermission();
    if (permission === 'denied') {
      console.warn('Push notification permission denied');
      return false;
    }

    if (permission !== 'granted') {
      permission = await requestPushNotificationPermission();
    }

    if (permission !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID public key from server
    const vapidUrl = buildApiUrl('/notifications/vapid-public-key');
    const vapidResponse = await fetch(vapidUrl);
    if (!vapidResponse.ok) {
      throw new Error(`Failed to get VAPID key: ${vapidResponse.statusText}`);
    }
    const vapidData = await vapidResponse.json() as { publicKey: string };
    const vapidPublicKey = vapidData.publicKey;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to server
    const accessToken = await getValidAccessToken();
    const subscribeUrl = buildApiUrl('/notifications/subscribe');
    const subscribeResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(subscription.toJSON())
    });

    if (!subscribeResponse.ok) {
      throw new Error(`Failed to subscribe: ${subscribeResponse.statusText}`);
    }

    console.log('Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return true; // Already unsubscribed
    }

    // Notify server
    const accessToken = await getValidAccessToken();
    const unsubscribeUrl = buildApiUrl('/notifications/unsubscribe');
    const unsubscribeResponse = await fetch(unsubscribeUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    if (!unsubscribeResponse.ok) {
      throw new Error(`Failed to unsubscribe: ${unsubscribeResponse.statusText}`);
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    console.log('Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Failed to check push subscription status:', error);
    return false;
  }
}
