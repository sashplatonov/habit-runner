/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

type NotificationOptionsWithImage = NotificationOptions & { image?: string };

// Precache app shell — list injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);

// Handle push events in the service worker
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    return;
  }

  let notificationData: { title: string; body: string };

  try {
    notificationData = event.data.json();
  } catch {
    notificationData = {
      title: 'Habit Runner',
      body: event.data.text()
    };
  }

  const origin = self.location.origin;
  const iconUrl = `${origin}/icon-192.png`;

  event.waitUntil(
    (async () => {
      // Pre-fetch icon to ensure it's in cache before Firefox tries to load it
      try {
        await fetch(iconUrl);
      } catch {
        // ignore — proceed without icon cache guarantee
      }

      const opts: NotificationOptionsWithImage = {
        body: notificationData.body,
        icon: iconUrl,
        badge: iconUrl,
        image: `${origin}/icon-512.png`,
        tag: 'habbit-reminder',
        requireInteraction: false
      };

      await self.registration.showNotification(notificationData.title, opts as unknown as NotificationOptions);
    })()
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
