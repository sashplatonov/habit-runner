# Telegram Mini App rollout

This runbook is the release record and operator checklist for the Telegram
Mini App. It keeps the Telegram credential in the backend runtime and treats
the static frontend URL as public configuration.

## Configure BotFather

1. Create a dedicated test bot and a production bot in [@BotFather](https://t.me/BotFather).
2. Configure each bot's Main Mini App URL to its own deployed HTTPS origin.
   Do not point a production bot at localhost or staging.
3. Configure the web build with the public `VITE_TELEGRAM_BOT_USERNAME`. The
   account page uses `https://t.me/<bot_username>?startapp=<pairing-code>` to
   open this bot's Mini App. The pairing code is short-lived and is completed
   automatically after the Mini App authenticates with Telegram; never place
   the bot token in a URL.
4. Record the bot username and URL in the deployment system, not in source
   control. The manual test account must be able to launch the webview and
   complete both email→Telegram and Telegram→email linking flows.

## Account-linking flows

There are two supported flows. Do not ask users to paste pairing codes into
the Mini App.

1. **Website → Telegram:** an authenticated Google/email user starts a link
   from Account connections. **Link Telegram** opens the `t.me` deep link in a
   new window, leaving Account open. The Mini App verifies Telegram and
   completes the merge immediately; the resulting session uses the same
   canonical account and habits as the website.
2. **Telegram → Google:** a Mini App user chooses **Sign in with Google**.
   Telegram authentication runs first, then Google OAuth merges the selected
   Google/email account into that Telegram account.

## Provision and rotate secrets

Set these variables in the backend runtime environment (Dokploy/CI secret
store or a local ignored `.env` file):

- `TELEGRAM_BOT_TOKEN` — required for production readiness and HMAC verification.
- `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` — optional freshness bound; default `86400`.
- `VITE_TELEGRAM_BOT_USERNAME` — public build-time bot username used for
  website-to-Telegram deep links.

The token must never be a `VITE_*` variable, checked into Git, or printed in
logs. To rotate it, create a replacement token in BotFather, update the backend
secret atomically, restart the API, and verify `/api/q/health/ready` plus a fresh
Telegram session. Revoke the old token in BotFather after the new deployment is
healthy. If compromise is suspected, revoke immediately, remove the runtime
secret, disable the Mini App URL, and redeploy; readiness should fail until a
valid token is provisioned.

After a deployment, the API logs `event=telegram_auth_configuration_loaded`
with a 12-character SHA-256 reference for the token it actually received. To
compare it with the intended secret without printing that secret, run this in a
terminal where the secret is already set:

```sh
printf %s "$TELEGRAM_BOT_TOKEN" | shasum -a 256 | cut -c1-12
```

The output must equal `botTokenRef` in the startup log and in any
`telegram_init_data_rejected` event. A mismatch means the deployed runtime has
a different secret; the bot username does not participate in HMAC validation.
The verification key is derived as `HMAC-SHA-256(key="WebAppData",
message=botToken)` before signing the sorted init-data fields.

## Release evidence

Collect these as separate evidence classes:

1. **Local repository proof:** Compose config, frontend check, Maven verify,
   generated OpenAPI parity, and security scans pass on the release commit.
2. **Remote CI proof:** a fresh CI run for the exact commit is green. A local
   build does not substitute for this evidence.
3. **Manual staging proof:** using the official Telegram app and the staging
   test account, launch the webview, sign in with Telegram, link an email
   account; repeat from email to Telegram; close/reopen the webview; and verify
   the same habits/check-ins and unlink behavior. Confirm the deployed HTTPS
   origin and browser cookies in the real webview. Confirm that Account refreshes
   to the Telegram username, then test unlinking each provider
   while the other remains, then verify final-provider unlink is rejected.

## Mobile and Mini App UX evidence

The responsive release gate covers the same protected account and preference
contracts as desktop. The browser matrix uses `compact-mobile` (device
baseline), `mobile` (390px), and `telegram-webview` (390px Telegram user-agent)
projects. The focused checks are:

```bash
cd apps/web && npm run test -- telegram.webApp telegram.session AccountConnections ThemePicker modernStats
cd apps/web && npm run test:e2e -- --project=mobile --project=telegram-webview mobile-ux.spec.ts telegram-mini-app.spec.ts account-linking.spec.ts
cd apps/web && npm run check:web
cd apps/backend && ./mvnw clean verify
```

The browser projects use a controlled SDK adapter and therefore prove layout,
focus, safe-area variables, color mapping, and request sequencing only. They do
not prove BotFather configuration, real Telegram HMAC validation, webview
cookies, or device-specific viewport behavior. Before release, record the
official Telegram-app test separately: open the deployed HTTPS Mini App, verify
dark and light Telegram themes, close/reopen, use Today and Progress, open
More/theme, link and unlink both providers, and confirm the same habits and
preferences remain after reload.

Do not claim local checks prove BotFather configuration, deployed ingress,
Telegram signature verification against the real bot, or webview cookie
behavior.

If website-to-Telegram pairing returns 403, verify the current
`habbit_runner_csrf_token` cookie was sent as `X-CSRF-Token` and correlate the
response `X-Trace-Id` with API logs. A fresh remote deployment and manual
Telegram-app test are required; local Playwright mocks are not a replacement.

## Rollback

If staging or production verification fails, disable the BotFather Main Mini
App URL, remove the backend runtime token (or restore the last known-good
secret), and redeploy the last known-good image. Keep the database identities
and link records intact so a later recovery does not create duplicate accounts.

## Change record

- **Change:** document and configure Telegram Mini App authentication and
  bidirectional email linking. Website-origin links now use the bot's `t.me`
  deep link so they open inside Telegram; BotFather still points the Mini App
  itself at the website root. Expired saved website links are discarded without
  an error, and the account action opens a fresh Mini App link directly. The
  backend validates Telegram init data with the specified HMAC key order.
- **Risk:** an exposed or stale bot token could permit forged init data; an
  incorrect HTTPS URL prevents the webview from launching.
- **Mitigation:** backend-only secret, bounded init-data age, readiness checks,
  separate bot environments, and explicit manual staging proof.
- **Rollback:** disable the BotFather URL, revoke/remove the token, and restore
  the previous deployment as described above.
- **Account-connections change:** the nullable `auth_identities.displayName`
  migration is additive. Restore the previous image and UI/API compatibility
  path if needed; do not reverse the Flyway migration or delete identities.
