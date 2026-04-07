import { buildApiUrl } from '$lib/api/url';
import { getValidAccessToken } from '$lib/auth/session';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function getPushNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

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
    applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
  });

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
  return true;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return true;
  }

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

  await subscription.unsubscribe();
  return true;
}

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
