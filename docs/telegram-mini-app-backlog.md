# Telegram Mini App and Account Linking - Implementation Backlog

## Goal

Deliver a Telegram Mini App that opens the Habbit Runner experience for a
Telegram user and uses the same server-backed habits, check-ins, preferences,
and history as the web application. A person can start in Telegram and later
link their Google-authenticated email account, or start in the web application
and link Telegram. Both entry points must resolve to one canonical account.

In this repository, “email sign-in” currently means the existing Google OAuth
flow, which creates or finds a user by the Google-provided email address. This
backlog does not introduce password, magic-link, or SMTP authentication. Those
are a separate product and security scope.

## Architectural decisions

- `users.id` remains the only owner of habits, check-ins, tombstones, refresh
  tokens, push subscriptions, and preferences. A Telegram account never owns a
  parallel data set once linking completes.
- Create an `auth_identities` persistence model with a unique
  `(provider, providerSubject)` and a many-to-one relation to `users`. It is
  the source of truth for Google and Telegram identities; `users.email` is a
  display/backward-compatibility field, not a provider key.
- Migrate every existing user to a Google identity derived from its existing
  normalized email, then upgrade that legacy identity to the verified Google
  subject on the next Google OAuth sign-in. Do not create a second user merely
  because the old installation has no stored Google subject yet.
- Telegram authentication accepts only raw `Telegram.WebApp.initData` and
  validates its HMAC, `auth_date`, bot configuration, and parsed user before
  using any value. `initDataUnsafe`, a Telegram username, and client-supplied
  user IDs are never authorization inputs.
- A short-lived, single-use pairing challenge implements web-to-Telegram
  linking. It becomes a pending request after Telegram authentication and is
  finalized only by an explicit confirmation in the already authenticated web
  session. A leaked `startapp` URL therefore cannot attach an attacker's
  Telegram account by itself.
- Telegram-to-Google linking reuses the existing OAuth state/callback
  mechanism, extended with an authenticated link intent bound to the current
  canonical user. It must not infer ownership from matching emails.
- When two verified identities already belong to different users, require an
  explicit, dual-proof account merge. Move all user-owned rows transactionally
  to a deterministic surviving user, revoke the absorbed user's refresh-token
  families, preserve all data, and return a conflict rather than silently
  choosing one account.
- The Mini App is a SvelteKit route in the existing `apps/web` build and calls
  the existing `/api` proxy. It reuses the typed API clients, stores, shared
  habit UI, and authenticated REST resources; do not create a Telegram-only
  habit/check-in API, cache, or duplicate store.
- The MVP uses a BotFather-configured Main Mini App and `startapp` deep links.
  No webhook or standalone bot process is needed solely for opening the app or
  completing a pairing. Bot commands, reminders, and chat notifications are
  outside this backlog.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P0-1 | P0 | - | Establishes one durable identity-to-user mapping before any new login can create data. |
| 2 | P0-2 | P0 | P0-1 | Adds server-side Telegram proof and sessions without trusting Mini App client data. |
| 3 | P1-1 | P1 | P0-1, P0-2 | Makes both account-link directions and collision handling safe. |
| 4 | P1-2 | P1 | P0-2, P1-1 | Lets a Telegram client authenticate and use the existing product surfaces. |
| 5 | P1-3 | P1 | P1-1 | Gives an email/Google user a visible, confirmable Telegram-link path. |
| 6 | P2-1 | P2 | P1-1, P1-2, P1-3 | Proves both cross-device identity journeys and prevents data divergence. |
| 7 | P2-2 | P2 | P2-1 | Documents/configures the bot and verifies build, migration, API, and deployment contracts. |

## P0-1: Introduce canonical account identities and an additive migration

**Status:** ✅ Completed
**Priority:** P0  
**Depends on:** -

### Outcome

The database can represent a Telegram-only user and a user with several
verified login identities while preserving every existing Google/email user's
current `users.id` and data.

### Architectural decision

The backend owns the identity graph. `UserEntity` remains the owner of product
data; a new top-level identity entity, access interface, repository, and
service resolve an external identity to that owner. Do not put identity fields
directly on `UserEntity` or copy provider identifiers into habit tables.

### Files

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/UserEntity.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/UserRepository.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/UserService.java`.
- Create `apps/backend/src/main/resources/db/migration/V13__add_auth_identities_and_pairing_challenges.sql`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AuthIdentityEntity.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AccountLinkChallengeEntity.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AuthProvider.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/IdentityService.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/AuthIdentityRepository.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/AccountLinkChallengeRepository.java`.
- Modify or create focused tests under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/` and `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/`.

### Work

1. Add additive Flyway tables, foreign keys, uniqueness constraints, expiry
   indexes, and a nullable email migration that permits a Telegram-first user
   without a fabricated email address.
2. Backfill one legacy Google/email identity per existing normalized email;
   make the migration idempotent and retain the existing `users.id` unchanged.
3. Introduce top-level identity and pairing-challenge types, repositories, and
   services that distinguish `GOOGLE` from `TELEGRAM`, keep provider subjects
   opaque, and normalize emails consistently.
4. Add a transactional user-data transfer operation that moves every current
   user-owned relation still present in the current schema (`habits`,
   `checkins`, `refresh_tokens`, `auth_identities`, and `push_subscriptions`),
   reconciles unique endpoint conflicts, and
   deletes the absorbed user only after references are safe.
5. Add PostgreSQL migration and service coverage for legacy users,
   Telegram-only users, uniqueness races, and a collision-safe merge. Do not
   add quality suppressions.

### Acceptance criteria

- An existing Google/email user keeps the same user ID and can still load all
  prior habits and check-ins after migration.
- A new Telegram-only user has no synthetic email, exactly one unique Telegram
  identity, and can own normal product data.
- The same Telegram numeric user ID or Google subject cannot be linked to two
  users, including concurrent requests.
- A merge moves all supported owned records to one survivor in one transaction;
  a failed merge leaves neither a partial move nor an orphaned identity.
- Migration tests run against PostgreSQL, not only H2.

### Verification

```bash
cd apps/backend && ./mvnw test
cd apps/backend && ./mvnw verify -Ppostgres-it
```

### Commit

```bash
git add apps/backend/src/main/resources/db/migration/V13__add_auth_identities_and_pairing_challenges.sql apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/UserEntity.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AuthIdentityEntity.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AccountLinkChallengeEntity.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/UserService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration
git commit -m "feat(auth): Add linked account identities"
```

## P0-2: Authenticate Telegram Mini App sessions on the backend

**Status:** ⬜ Not started  
**Priority:** P0  
**Depends on:** P0-1

### Outcome

A real Telegram Mini App can exchange a freshly validated `initData` payload
for the existing Habbit Runner cookie session and receive the same authenticated
API access as a web user.

### Architectural decision

Extend `AuthResource`, `AuthService`, `AuthConfig`, `JwtUtil`, and the existing
refresh-token/cookie issuance path. The Telegram verifier is server-side and
returns a canonical user ID; browser code never creates a JWT or decides which
user owns the identity.

### Files

- Modify `apps/backend/src/main/resources/application.properties`.
- Modify `apps/backend/src/test/resources/application.properties`.
- Modify `apps/backend/src/test/resources/application-postgres-it.properties`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/config/AuthConfig.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthCollaborators.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/telegram/TelegramInitDataVerifier.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/telegram/TelegramWebAppUser.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/TelegramSessionRequest.java`.
- Modify or create focused tests under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`.

### Work

1. Add required bot-token and maximum-init-data-age configuration, validate it
   at readiness/startup, and expose no token through OpenAPI, frontend build
   variables, logs, responses, or metrics.
2. Implement Telegram's documented HMAC data-check-string validation over the
   raw query string, constant-time hash comparison, URL-decoding rules,
   `auth_date` freshness/future-skew checks, and strict JSON parsing of the
   Telegram user object.
3. Add a rate-limited `POST /auth/telegram/session` contract that accepts raw
   `initData`, resolves or creates the canonical user through `IdentityService`,
   then issues cookies through the existing access/refresh/CSRF mechanism.
4. Return an unambiguous 400/401/403 response for malformed, stale, bad-signature,
   bot-misconfigured, or unauthorized payloads without exposing the bot token
   or accepting replayable client identity fields.
5. Record low-cardinality authentication outcomes by provider and update
   existing auth resource/service tests.

### Acceptance criteria

- A valid, fresh `initData` for an unlinked Telegram ID creates or resolves one
  canonical user and can call an existing `@RequireAuth` API with the issued
  session.
- Changing any signed field, the hash, or the parsed Telegram ID is rejected.
- Expired and future-dated payloads are rejected according to configured
  bounds; a valid payload cannot be treated as a trusted client-side object.
- Existing Google login, refresh rotation, CSRF checks, bearer access, and
  `/auth/session` behavior remain compatible.
- The bot token is never present in source-controlled example values, browser
  bundles, logs, test snapshots, or OpenAPI output.

### Verification

```bash
cd apps/backend && ./mvnw test
cd apps/backend && ./mvnw verify -Ppostgres-it
```

### Commit

```bash
git add apps/backend/src/main/resources/application.properties apps/backend/src/test/resources/application.properties apps/backend/src/test/resources/application-postgres-it.properties apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/config/AuthConfig.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthCollaborators.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/telegram apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/TelegramSessionRequest.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth
git commit -m "feat(auth): Verify Telegram Mini App sessions"
```

## P1-1: Add explicit bidirectional linking and account merge APIs

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** P0-1, P0-2

### Outcome

An authenticated web user can start a Telegram pairing, and an authenticated
Telegram user can attach Google. When both sides already have data, the API
requires explicit proof and then produces one account with all data.

### Architectural decision

Use one account-linking service and the existing authenticated context, OAuth
state, cookie, rate-limit, and error conventions. Pairing challenge state is
stored in PostgreSQL, not in browser storage or a Telegram deep-link parameter.
Google OAuth callback state carries the link intent; it must be consumed once.

### Files

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/OAuthStateEntity.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/access/OAuthStateAccess.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/OAuthSupport.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/OAuthHelper.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java`.
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/link/AccountLinkService.java`.
- Create request/response DTOs under `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/`.
- Modify or create focused tests under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`.

### Work

1. Define authenticated APIs to create a short-lived pairing challenge, submit
   it from a validated Telegram session, inspect pending status, explicitly
   confirm from the original web session, cancel, and expire it.
2. Define a Google-link start/callback mode bound to the authenticated Telegram
   user and a Telegram-aware callback target; preserve the normal Google login
   contract and reject an OAuth state used twice.
3. When identities resolve to different users, require confirmation from both
   authenticated identities before invoking the transfer operation from P0-1;
   return a documented conflict state while confirmation is incomplete.
4. Invalidate the absorbed account's refresh-token families and make every
   session re-resolve its canonical user after merge. Do not merge based only on
   a display email or Telegram username.
5. Add OpenAPI annotations and tests for ownership, replay, expiry, cancel,
   duplicate identity, two-account merge, and normal Google-login regression.

### Acceptance criteria

- Email/Google-first linking produces a Telegram deep link whose challenge is
  single-use and expires; opening it with a different Telegram account does
  not complete the link without confirmation in the original web session.
- Telegram-first linking proves the current Telegram identity and a completed
  Google OAuth identity before attaching Google to the same user.
- If both accounts contain data, no rows move until both proofs and explicit
  confirmation are complete; after completion, both entry points see the
  combined data under one canonical user ID.
- Reusing, cancelling, expiring, or guessing a challenge never links accounts.
- A normal Google sign-in still redirects to the normal `/auth/callback` flow
  and does not create duplicate identities.

### Verification

```bash
cd apps/backend && ./mvnw test
cd apps/backend && ./mvnw verify -Ppostgres-it
cd apps/backend && ./mvnw package -DskipTests -Dquarkus.smallrye-openapi.store-schema-directory=../../spec/openapi
git diff --exit-code -- spec/openapi/openapi.yaml
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/OAuthStateEntity.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/access/OAuthStateAccess.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/OAuthSupport.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/OAuthHelper.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/link apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth spec/openapi/openapi.yaml
git commit -m "feat(auth): Link Google and Telegram accounts"
```

## P1-2: Deliver the Telegram Mini App entry and authenticated shell

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** P0-2, P1-1

### Outcome

Opening the configured Mini App authenticates the Telegram user, restores the
same server-backed dashboard, habits, check-ins, and statistics, and gives a
Telegram-first user a clear Google-link action.

### Architectural decision

Create `/telegram` routes as thin adapters around the existing app runtime,
habit store, typed API clients, and reusable screens. Keep Telegram SDK
initialization and Mini App-specific theme/safe-area behavior in a dedicated
frontend integration module; do not fork the product state or mutate it from
`initDataUnsafe`.

### Files

- Create `apps/web/src/lib/telegram/webApp.ts`.
- Create `apps/web/src/lib/telegram/session.ts`.
- Create `apps/web/src/routes/telegram/+layout.svelte`.
- Create `apps/web/src/routes/telegram/+page.svelte`.
- Create `apps/web/src/routes/telegram/auth/callback/+page.svelte`.
- Create `apps/web/src/routes/telegram/habit/[id]/+page.svelte`.
- Create `apps/web/src/routes/telegram/habit/new/+page.svelte`.
- Create `apps/web/src/routes/telegram/habit/[id]/edit/+page.svelte`.
- Create `apps/web/src/routes/telegram/stats/+page.svelte`.
- Modify `apps/web/src/lib/auth/session.ts` and `apps/web/src/lib/components/AppLayout.svelte` only where reuse requires a route-base or session abstraction.
- Create focused unit tests under `apps/web/tests/unit/` and browser coverage under `apps/web/tests/e2e/`.

### Work

1. Load the official Telegram Web Apps script only on `/telegram`, call
   `ready()`/viewport expansion safely, and expose a typed, SSR-safe adapter
   for `initData`, theme parameters, safe-area CSS variables, close behavior,
   and `start_param`.
2. Exchange raw `initData` with the backend before loading user data; show a
   recoverable loading/error state when the app is opened outside Telegram,
   initialization is unavailable, or server authentication fails.
3. Reuse the existing authenticated fetch/session handling and domain stores so
   all reads and mutations target the same `/api` resources and `userId`.
4. Implement Telegram route adapters for dashboard, detail, create, edit, and
   statistics, with a compact navigation mode, safe areas, no horizontal
   overflow at 320px, keyboard focus, and 44x44px touch targets.
5. Read `start_param` only as a pairing-handshake input, pass it with the
   verified session to the linking API, and never treat it as proof of a user.
   Provide the Telegram-to-Google linking action and return safely after the
   OAuth callback.

### Acceptance criteria

- In a real Telegram webview, a valid Mini App launch reaches the user's
  existing dashboard without a second login and changes are visible from the
  normal web application after reload.
- A first-time Telegram user can create a habit, close/reopen the Mini App,
  and see the same server-backed data.
- At 320px and on a Telegram mobile viewport, primary navigation, completion,
  create, edit, retry, and link controls remain visible, reachable, and
  horizontally contained.
- Outside Telegram, the route neither trusts fabricated query parameters nor
  loops; it explains how to open the Mini App safely.
- Telegram theme and safe-area values affect only the Mini App shell; the
  normal PWA and showcase routes retain their current behavior.

### Verification

```bash
cd apps/web && npm run check:web
cd apps/web && npm run test:unit -- telegram
cd apps/web && npm run test:e2e -- telegram
```

### Commit

```bash
git add apps/web/src/lib/telegram apps/web/src/lib/auth/session.ts apps/web/src/lib/components/AppLayout.svelte apps/web/src/routes/telegram apps/web/tests/unit apps/web/tests/e2e
git commit -m "feat(telegram): Add Mini App experience"
```

## P1-3: Add the web account-linking experience

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** P1-1

### Outcome

A signed-in Google/email user can inspect linked accounts, open a Telegram
pairing link, verify the pending Telegram identity, confirm or cancel the
link, and understand a merge/conflict state.

### Architectural decision

The web page is a client for P1-1's account-link APIs. It must display only
server-provided, privacy-safe account labels and poll/refetch server state; it
does not persist challenge tokens, identity ownership, or merge decisions in
localStorage.

### Files

- Create `apps/web/src/lib/api/accountLinks.ts`.
- Create `apps/web/src/lib/components/AccountConnections.svelte`.
- Create `apps/web/src/routes/app/(protected)/account/+page.svelte`.
- Modify `apps/web/src/lib/components/SidebarNav.svelte`.
- Modify `apps/web/src/lib/components/BottomNav.svelte`.
- Modify `apps/web/src/lib/components/MobileMoreSheet.svelte` if the mobile account route must be reachable there.
- Create focused unit tests under `apps/web/tests/unit/` and browser coverage under `apps/web/tests/e2e/`.

### Work

1. Add typed API-client methods for account identities, creating/cancelling a
   pairing, pending status, confirmation, and structured conflicts; use the
   existing `authenticatedFetch` and `ApiError` paths.
2. Add an authenticated Account page and navigation route that shows Google
   email availability, linked Telegram account label, link/unlink eligibility,
   a copy/open Telegram deep link, expiry countdown, retry, cancel, and
   confirmation.
3. Make the confirmation step explicit and accessible: explain the Telegram
   identity about to be linked, prevent duplicate submit, restore state after
   reload, and communicate timeout/cancel/conflict without leaking a full
   provider subject.
4. Give a merge conflict a deliberate confirmation surface; never silently
   merge or hide data loss risk behind a generic success toast.
5. Test keyboard operation, visible focus, 44x44px controls, mobile geometry,
   loading/error/retry states, and session expiry redirect behavior.

### Acceptance criteria

- A signed-in web user can link the Telegram account reached through the
  generated deep link only after seeing and confirming its server-verified
  label.
- Reloading the Account page restores the current server-side pending state;
  no challenge secret is required from localStorage.
- An expired, cancelled, already-used, or unauthorized challenge presents an
  actionable error and leaves all identities unchanged.
- Desktop and 320px mobile layouts keep controls accessible by keyboard and
  touch without horizontal scrolling.
- The existing dashboard and normal OAuth entry point remain reachable and
  unchanged for users who never link Telegram.

### Verification

```bash
cd apps/web && npm run check:web
cd apps/web && npm run test:unit -- accountLinks
cd apps/web && npm run test:e2e -- account-linking
```

### Commit

```bash
git add apps/web/src/lib/api/accountLinks.ts apps/web/src/lib/components/AccountConnections.svelte 'apps/web/src/routes/app/(protected)/account' apps/web/src/lib/components/SidebarNav.svelte apps/web/src/lib/components/BottomNav.svelte apps/web/src/lib/components/MobileMoreSheet.svelte apps/web/tests/unit apps/web/tests/e2e
git commit -m "feat(web): Add Telegram account linking"
```

## P2-1: Prove cross-surface identity, merge, and data parity

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P1-1, P1-2, P1-3

### Outcome

Automated checks prove the two requested entry orders and show that linked
accounts use the same product data instead of duplicate user-owned rows.

### Architectural decision

Backend integration tests are authoritative for signatures, persistence,
transactionality, and ownership. Playwright uses a controlled Telegram Web App
adapter and mocked backend contracts for browser geometry/interaction; a
manual staging check is still required for a real Telegram client.

### Files

- Modify or create tests under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/` and `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/`.
- Modify or create `apps/web/tests/unit/telegram*.test.ts`.
- Create `apps/web/tests/e2e/telegram-mini-app.spec.ts`.
- Create `apps/web/tests/e2e/account-linking.spec.ts`.
- Modify `apps/web/playwright.config.ts` only if a Telegram-webview project or controlled adapter is required.

### Work

1. Add backend tests covering valid/invalid/fresh/stale Telegram `initData`,
   Google-first pairing, Telegram-first Google linking, replays, cancellation,
   account collision, merge confirmation, rollback, and refresh-token
   revocation after merge.
2. Add a PostgreSQL integration scenario that writes habits/check-ins through
   each pre-merge account, completes the approved merge, then verifies one
   canonical user can read and mutate the full combined result.
3. Add Playwright journeys for the Telegram adapter: first launch, existing
   linked user, failed validation/retry, pairing start parameter, callback
   return, and 320px compact mobile controls.
4. Add regression coverage that ordinary Google OAuth, PWA routes, and
   showcase behavior do not require Telegram SDK availability.

### Acceptance criteria

- The suite proves both “Telegram then Google/email” and “Google/email then
  Telegram” paths resolve to one user and the same habit/check-in data.
- Tests prove a tampered, stale, or replayed identity/pairing payload cannot
  access or link an account.
- A merge failure leaves source users and all data intact; a successful merge
  leaves no accessible stale session for the absorbed user.
- Browser tests run in desktop and compact-mobile projects without depending
  on a live Telegram account or bot token.

### Verification

```bash
cd apps/backend && ./mvnw verify
cd apps/backend && ./mvnw verify -Ppostgres-it
cd apps/web && npm run test:coverage
cd apps/web && npm run test:e2e -- telegram-mini-app account-linking
```

### Commit

```bash
git add apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration apps/web/tests/unit apps/web/tests/e2e apps/web/playwright.config.ts
git commit -m "test(auth): Cover Telegram account linking"
```

## P2-2: Document, configure, and release the Mini App safely

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P2-1

### Outcome

Operators can configure the Telegram bot and HTTPS Mini App URL without
committing secrets, and the repository records the API, migration, deployment,
and manual Telegram-client proof required for release.

### Architectural decision

Configuration belongs in the backend runtime environment; the static frontend
contains no bot token. Existing Compose environment entries are preserved and
extended only after repository-wide usage checks. The deployment continues to
serve the Mini App from the existing HTTPS web origin and `/api` proxy.

### Files

- Modify `.env.example`.
- Modify `apps/backend/README.md`.
- Modify `docs/setup/getting-started.md`.
- Modify `docs/architecture/api-contract.md`.
- Modify `apps/web/src/routes/privacy-policy/+page.svelte`.
- Modify `spec/openapi/openapi.yaml`.
- Create `docs/telegram-mini-app-rollout.md`.
- Modify `docker-compose.yml`, `docker-compose.local.yml`, and `docker-compose.dokploy.yml` only if the verified runtime configuration requires new Telegram variables; preserve all existing environment entries.

### Work

1. Document BotFather setup: bot ownership, Main Mini App URL, allowed HTTPS
   URL, deep-link format, local/staging URL separation, and the manual test
   account required before production rollout.
2. Add non-secret environment examples and describe secret provisioning,
   rotation, expiry bounds, readiness failure, rollback (disable the Mini App
   URL/remove the runtime secret), and how to revoke a compromised bot token.
3. Update the generated OpenAPI snapshot and contract documentation for
   Telegram session/link endpoints and their error responses; update privacy
   copy to cover Telegram account identifiers and the purpose of linking.
4. Add the required rollout-log entry with the change, risk, and rollback.
5. Run local build/config/security checks, then require a fresh remote CI run
   and a manual staging proof using the official Telegram app. Do not claim
   local checks prove BotFather setup, deployed HTTPS, or real webview cookies.

### Acceptance criteria

- A new operator can configure the Mini App without finding a token in source
  control or placing one in a Vite variable.
- Compose rendering succeeds with the same stack files/profiles used for the
  target environment, and existing Google OAuth/push/environment values remain
  present.
- API documentation and privacy copy describe the added identity data and
  account-linking behavior accurately.
- Release evidence distinguishes successful local checks, a fresh successful
  remote CI run, and a manual Telegram staging launch/link/reopen test.

### Verification

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile db config
docker compose -f docker-compose.dokploy.yml config
cd apps/web && npm run check
cd apps/backend && ./mvnw verify
cd apps/backend && ./mvnw package -DskipTests -Dquarkus.smallrye-openapi.store-schema-directory=../../spec/openapi
git diff --exit-code -- spec/openapi/openapi.yaml
```

### Commit

```bash
git add .env.example apps/backend/README.md docs/setup/getting-started.md docs/architecture/api-contract.md apps/web/src/routes/privacy-policy/+page.svelte spec/openapi/openapi.yaml docs/telegram-mini-app-rollout.md docker-compose.yml docker-compose.local.yml docker-compose.dokploy.yml
git commit -m "docs(telegram): Document Mini App rollout"
```

## Release gate

Before enabling the BotFather production URL, complete P0-1 through P2-2 and
collect all of the following evidence:

- local Maven unit, PostgreSQL integration, frontend static/type/lint, and
  Playwright checks succeed;
- the generated OpenAPI snapshot is current;
- a fresh remote CI workflow succeeds after the feature branch is pushed;
- a staging operator opens the Mini App from Telegram, tests both link orders,
  confirms a merge only when intentionally requested, closes/reopens the Mini
  App, and verifies the same data from the normal web application;
- production bot token, Mini App URL, Google callback URL, CORS origin, and
  HTTPS deployment configuration have been independently reviewed.
