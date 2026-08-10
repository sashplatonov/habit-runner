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
   open this bot's Mini App. The pairing code is short-lived and requires the
   account owner's explicit confirmation; never place the bot token in a URL.
4. Record the bot username and URL in the deployment system, not in source
   control. The manual test account must be able to launch the webview and
   complete both email→Telegram and Telegram→email linking flows.

## Account-linking flows

There are two supported flows. Do not ask users to paste pairing codes into
the Mini App.

1. **Website → Telegram:** an authenticated Google/email user starts a link
   from Account connections. The `t.me` deep link opens the Mini App, which
   verifies Telegram and waits for the website owner to confirm the merge.
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
  bidirectional email linking. Website-origin links now use the bot's `t.me`
  deep link so they open inside Telegram; BotFather still points the Mini App
  itself at the website root.
- **Risk:** an exposed or stale bot token could permit forged init data; an
  incorrect HTTPS URL prevents the webview from launching.
- **Mitigation:** backend-only secret, bounded init-data age, readiness checks,
  separate bot environments, and explicit manual staging proof.
- **Rollback:** disable the BotFather URL, revoke/remove the token, and restore
  the previous deployment as described above.
