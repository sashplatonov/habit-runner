# Web Push Setup

<a name="top"></a>

## 📋 Table of Contents

- [What this covers](#what-this-covers)
- [Prerequisites](#prerequisites)
- [Generate VAPID keys](#generate-vapid-keys)
- [Configure backend and frontend](#configure-backend-and-frontend)
- [Verify the flow](#verify-the-flow)
- [Troubleshooting](#troubleshooting)

---

## 🔔 What this covers <a name="what-this-covers"></a>

Habit Runner uses browser push subscriptions for reminder delivery. The current implementation exposes:
- `GET /notifications/vapid-public-key`
- `POST /notifications/subscribe`
- `DELETE /notifications/unsubscribe`

The backend stores subscription endpoints in PostgreSQL and the frontend handles browser permission + service worker registration.

[↑ Back to top](#top)

---

## ✅ Prerequisites <a name="prerequisites"></a>

- backend running from `apps/backend`;
- frontend running from `apps/web`;
- HTTPS in production;
- valid VAPID keys;
- a browser that supports Push API and service workers.

Notes:
- local backend configuration must be exported in the shell; the current repo does not auto-load `apps/backend/.env`;
- frontend API target should point at the backend through `VITE_API_BASE_URL` when needed.

[↑ Back to top](#top)

---

## 🔑 Generate VAPID keys <a name="generate-vapid-keys"></a>

Run once on a machine with Node installed:

```bash
npx web-push generate-vapid-keys
```

Store the result securely:

```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

For Docker Compose, place them in the root `.env`.

For local backend runs, export them in the shell before starting Quarkus:

```bash
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
export VAPID_SUBJECT=mailto:admin@localhost
```

[↑ Back to top](#top)

---

## ⚙️ Configure backend and frontend <a name="configure-backend-and-frontend"></a>

Backend requirements:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- auth env if you want the full authenticated subscription flow

Frontend local override example:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Run the services:

```bash
docker compose --profile db up -d db

cd apps/backend
./mvnw quarkus:dev
```

In another terminal:

```bash
cd apps/web
npm install
npm run dev
```

Flyway migrations are applied on backend startup, so no separate push-specific migration step is required.

[↑ Back to top](#top)

---

## 🧪 Verify the flow <a name="verify-the-flow"></a>

1. Open the app in the browser.
2. Sign in so authenticated notification endpoints are available.
3. Open the reminder or habit-edit flow that enables notifications.
4. Grant browser notification permission.
5. Confirm the backend serves a public key:

```bash
curl http://localhost:3000/notifications/vapid-public-key
```

6. Confirm subscription writes show up in backend logs or database records.

For Docker-backed local runs, verify the proxied path instead:

```bash
curl http://localhost/api/notifications/vapid-public-key
```

[↑ Back to top](#top)

---

## ⚠️ Troubleshooting <a name="troubleshooting"></a>

Common issues:
- `VAPID_PUBLIC_KEY not configured`: generate a fresh key pair and configure both VAPID environment variables.
- browser permission denied: reset site notification permission and retry.
- no subscription request reaches the backend: check `VITE_API_BASE_URL` and dev proxy behavior.
- Docker stack works but direct local backend does not: confirm env vars are exported in the shell, not only written to a file.
- no notifications in production: check HTTPS, service worker registration, and real browser push support on the target platform.

Useful checks:

```bash
docker compose logs -f api
docker compose logs -f web
```

```bash
cd apps/backend
./mvnw test
```

Security reminder:
- never commit `VAPID_PRIVATE_KEY`;
- rotate production keys deliberately and coordinate with deployment secrets.

[↑ Back to top](#top)
