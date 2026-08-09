# Telegram Mini App rollout

This runbook is the release record and operator checklist for the Telegram
Mini App. It keeps the Telegram credential in the backend runtime and treats
the static frontend URL as public configuration.

## Configure BotFather

1. Create a dedicated test bot and a production bot in [@BotFather](https://t.me/BotFather).
2. Configure each bot's Main Mini App URL to its own deployed HTTPS origin.
   Do not point a production bot at localhost or staging.
3. Use deep links such as
   `https://t.me/<bot_username>?startapp=<payload>` only for non-secret routing
   context. Never place a bot token in a payload or URL.
4. Record the bot username and URL in the deployment system, not in source
   control. The manual test account must be able to launch the webview and
   complete both email→Telegram and Telegram→email linking flows.

## Provision and rotate secrets

Set these variables in the backend runtime environment (Dokploy/CI secret
store or a local ignored `.env` file):

- `TELEGRAM_BOT_TOKEN` — required for production readiness and HMAC verification.
- `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` — optional freshness bound; default `86400`.
- `VITE_TELEGRAM_MINI_APP_URL` — public build-time URL; safe for the web image.

The token must never be a `VITE_*` variable, checked into Git, or printed in
logs. To rotate it, create a replacement token in BotFather, update the backend
secret atomically, restart the API, and verify `/api/q/health/ready` plus a fresh
Telegram session. Revoke the old token in BotFather after the new deployment is
healthy. If compromise is suspected, revoke immediately, remove the runtime
secret, disable the Mini App URL, and redeploy; readiness should fail until a
valid token is provisioned.

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
   origin and browser cookies in the real webview.

Do not claim local checks prove BotFather configuration, deployed ingress,
Telegram signature verification against the real bot, or webview cookie
behavior.

## Rollback

If staging or production verification fails, disable the BotFather Main Mini
App URL, remove the backend runtime token (or restore the last known-good
secret), and redeploy the last known-good image. Keep the database identities
and link records intact so a later recovery does not create duplicate accounts.

## Change record

- **Change:** document and configure Telegram Mini App authentication and
  bidirectional email linking.
- **Risk:** an exposed or stale bot token could permit forged init data; an
  incorrect HTTPS URL prevents the webview from launching.
- **Mitigation:** backend-only secret, bounded init-data age, readiness checks,
  separate bot environments, and explicit manual staging proof.
- **Rollback:** disable the BotFather URL, revoke/remove the token, and restore
  the previous deployment as described above.
