import { buildApiUrl } from '../api/url';
import { authenticatedFetch } from '../auth/session';

/**
 * Convert VAPID public key from URL-safe base64 to ArrayBuffer
 */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(outputArray.length);
  new Uint8Array(buffer).set(outputArray);
  return buffer;
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
    return false;
  }

  let permission = getPushNotificationPermission();
  if (permission === 'denied') {
    return false;
  }

  if (permission !== 'granted') {
    permission = await requestPushNotificationPermission();
  }

  if (permission !== 'granted') {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidUrl = buildApiUrl('/notifications/vapid-public-key');
  const vapidResponse = await fetch(vapidUrl);
  if (!vapidResponse.ok) {
    throw new Error(`Failed to get VAPID key: ${vapidResponse.statusText}`);
  }
  const vapidData = await vapidResponse.json() as { publicKey: string };
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(vapidData.publicKey)
  });

  const subscribeUrl = buildApiUrl('/notifications/subscribe');
  const subscribeResponse = await authenticatedFetch(subscribeUrl, {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON())
  });

  if (!subscribeResponse.ok) {
    throw new Error(`Failed to subscribe: ${subscribeResponse.statusText}`);
  }
  return true;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return true;
  }

  const unsubscribeUrl = buildApiUrl('/notifications/unsubscribe');
  const unsubscribeResponse = await authenticatedFetch(unsubscribeUrl, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });

  if (!unsubscribeResponse.ok) {
    throw new Error(`Failed to unsubscribe: ${unsubscribeResponse.statusText}`);
  }

  await subscription.unsubscribe();
  return true;
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
  } catch {
    return false;
  }
}
