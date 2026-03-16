# Web Push Notifications Setup Guide

## Overview

Web Push Notifications allow Habbit Runner to send reminders to users even when the app is closed (on desktop browsers and mobile PWA). Notifications are delivered through the browser's native notification system.

## Prerequisites

- Node.js and npm installed
- Access to environment variables (`.env` files or hosting platform secrets)
- HTTPS enabled in production (required for service workers)

## Setup Instructions

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required to authenticate your server with browser push services.

**Run this command once:**

```bash
cd packages/server
npx web-push generate-vapid-keys
```

**Output example:**
```
Public Key: BKT8nR5OScHpnHJfLG-xh5BTd0qVxnb_PxYfvQqYrKP5aE...
Private Key: 8f3e2d1c9b4a7f6e5d4c3b2a1f0e9d8c7b6a5f4e...
```

### 2. Configure Environment Variables

#### For Docker Compose (Production)

Update `/.env`:

```env
# Web Push Notifications
VAPID_PUBLIC_KEY=BKT8nR5OScHpnHJfLG-xh5BTd0qVxnb_PxYfvQqYrKP5aE...
VAPID_PRIVATE_KEY=8f3e2d1c9b4a7f6e5d4c3b2a1f0e9d8c7b6a5f4e...
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

#### For Local Development

Create `packages/server/.env`:

```env
VAPID_PUBLIC_KEY=BKT8nR5OScHpnHJfLG-xh5BTd0qVxnb_PxYfvQqYrKP5aE...
VAPID_PRIVATE_KEY=8f3e2d1c9b4a7f6e5d4c3b2a1f0e9d8c7b6a5f4e...
VAPID_SUBJECT=mailto:admin@localhost
```

Create `packages/web/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Deploy Database Migration

The Web Push feature requires new database tables. Apply the migration:

```bash
# If using Docker Compose:
docker compose exec api npx prisma migrate deploy

# If running locally:
cd packages/server
npx prisma migrate deploy
```

This creates:
- `push_subscriptions` table (stores browser endpoints)
- `freezeDays` field in `habits` table

### 4. Configure OAuth Redirects (if needed)

Ensure these URLs match your Google OAuth Console settings:

```env
API_PUBLIC_URL=https://yourdomain.com/api
OAUTH_DEFAULT_RETURN_TO=https://yourdomain.com
```

### 5. Verify Installation

After deploying:

1. Open the app in a browser
2. Go to Edit Habit page (any habit)
3. Scroll to bottom → "Push Notifications" section should appear
4. Click "Disabled" button
5. Browser prompts for permission → grant it
6. Button changes to "Enabled" ✅
7. Set a reminder time (e.g., 14:30)

### 6. Test Notifications

**Desktop Browser:**
- Set reminder for the current time + 1 minute
- Keep app closed/in background
- Wait for notification to appear in system notification tray

**Mobile PWA (Android):**
- Install app via "Add to Home Screen"
- Same steps as desktop
- Notification appears in Android notification tray

**iOS Safari:**
- Web Push not supported (Apple limitation)
- Notifications will still work when app is open (Notification API)

## Production Checklist

- ✅ VAPID keys generated and stored securely
- ✅ Environment variables set (use secrets manager, not hardcoded)
- ✅ HTTPS enabled
- ✅ Database migrations applied
- ✅ API_PUBLIC_URL and OAUTH_DEFAULT_RETURN_TO configured
- ✅ Service worker deployed (included in Vite build)
- ✅ Tested with at least one device

## Troubleshooting

### Notifications not appearing

1. **Check browser permission:**
   - Chrome/Edge: Settings → Privacy and security → Site settings → Notifications
   - Firefox: Preferences → Privacy → Permissions → Notifications

2. **Verify service worker:**
   - Open DevTools → Application → Service Workers
   - Should show one active service worker with "activated and running" status

3. **Check server logs:**
   ```bash
   docker compose logs api | grep -i notification
   ```

4. **Verify VAPID keys:**
   - Public and private keys must match
   - Ensure no extra whitespace in `.env` values

### "Cannot connect to push service" error

- Ensure HTTPS is enabled (required for Web Push)
- Check network connectivity
- Verify VAPID keys are valid

### Service worker not loading

- Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
- Check CORS settings (`CORS_ORIGINS` in .env)
- Verify `packages/web/vite.config.ts` has `strategies: 'injectManifest'`

## Architecture

- **Server:** `NotificationModule` handles subscriptions and sends pushes via Web Push API
- **Client:** Service Worker (`sw-custom.ts`) receives push events and shows notifications
- **Database:** `push_subscriptions` table stores browser endpoints per user
- **Sync:** Freeze days sync via existing sync protocol

## API Endpoints

### POST `/notifications/subscribe`
Register a browser for push notifications.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "auth": "...",
    "p256dh": "..."
  }
}
```

**Response:** `{ "success": true }`

### DELETE `/notifications/unsubscribe`
Unsubscribe from push notifications.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### GET `/notifications/vapid-public-key`
Get the VAPID public key for subscription.

**Response:**
```json
{
  "publicKey": "BKT8nR5OScHpnHJfLG-xh5BTd0qVxnb_PxYfvQqYrKP5aE..."
}
```

## Security Notes

⚠️ **NEVER commit VAPID_PRIVATE_KEY to Git**

- Use environment variables for all deployments
- Rotate keys annually for production
- Private key must be kept secret (like database passwords)
- Public key is safe to embed in client code (already done via API endpoint)

## References

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
