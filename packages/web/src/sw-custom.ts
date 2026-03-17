/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Precache app shell — list injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);

// Handle push events in the service worker
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    console.log('Push event received with no data');
    return;
  }

  let notificationData: { title: string; body: string };

  try {
    notificationData = event.data.json();
  } catch {
    notificationData = {
      title: 'Habbit Runner',
      body: event.data.text()
    };
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'habbit-reminder',
      requireInteraction: false
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });

      // Try to focus existing window
      for (const client of clients) {
        if (client.url === '/' && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }

      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })()
  );
});

// Claim clients and skip waiting for updates
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});
