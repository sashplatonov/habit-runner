# Account Connections and Telegram Linking - Implementation Backlog

## Goal

Make account connections a low-frequency utility rather than a primary navigation
destination. The Account page must show the verified linked Google/email and
Telegram accounts, let a user unlink either one while always retaining at least
one login method, and offer an in-card **Link Telegram** action that opens the
Telegram deep link in a new window. The current email-to-Telegram flow must no
longer fail with HTTP 403 after the deep link is opened.

## Architectural decisions

- `users.id` remains the canonical owner of habits, check-ins, preferences, and
  all other user data. `auth_identities` is the persisted source of truth for
  the available sign-in providers; browser session storage and a pending link
  token are UI state only.
- Extend the existing account-link boundary (`AccountLinkResource`,
  `AccountLinkService`, and `AuthIdentityRepository`) instead of creating a
  second account-settings API or a frontend-only connection store. Return both
  provider states from one authenticated connections response, then derive the
  Account page entirely from that response.
- Persist the Telegram username captured from server-verified `initData` on the
  Telegram identity. Do not expose the raw Telegram numeric ID, trust
  `initDataUnsafe`, or display a username that only exists on an expired
  challenge.
- A provider may be detached only in a transaction that proves a different
  usable provider remains for the same `users.id`. Detaching Google/email also
  clears the legacy `users.email` login lookup and its provider identity; it
  must not delete the user, habits, or the remaining Telegram identity.
- Keep the existing owner-confirmation rule: verifying the Telegram user marks
  a challenge ready, and only the original website owner may make the link or
  merge final. A deep-link token never authorizes a merge by itself.
- Preserve existing `GET /auth/link/telegram/connection` consumers only until
  the web client has migrated in the same change; do not maintain competing
  boolean and detailed connection models afterwards. Add the new consolidated
  authenticated connections contract under the existing `/auth/link` resource
  and regenerate `spec/openapi/openapi.yaml`.
- The 403 is treated as a CSRF/session-flow defect, not as a reason to weaken
  `CsrfGuardFilter`: after Telegram session creation the pairing POST must use
  the shared authenticated request path, which sends the current CSRF cookie
  value in `X-CSRF-Token`.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P0-1 | P0 | - | Restores the currently broken Telegram pairing path without reducing CSRF protection. |
| 2 | P1-1 | P1 | P0-1 | Establishes durable connection metadata and the safe unlink contract required by the Account UI. |
| 3 | P1-2 | P1 | P1-1 | Moves the low-frequency account entry point and implements the complete Account-page experience. |
| 4 | P2-1 | P2 | P0-1, P1-1, P1-2 | Adds browser, API, migration, and real-Telegram release proof against regressions. |
| 5 | P2-2 | P2 | P2-1 | Documents the changed contract, operational checks, risk, and rollback. |

## P0-1: Repair CSRF-safe Telegram pairing after deep-link launch

**Status:** ✅ Completed
**Priority:** P0  
**Depends on:** -

### Outcome

Opening a valid `startapp` deep link authenticates the Telegram webview and
submits the pairing token successfully instead of returning 403. The existing
CSRF requirement remains enforced for cookie-authenticated mutations.

### Architectural decision

`apps/web/src/lib/auth/session.ts` owns construction of cookie-authenticated
mutations. `authenticateTelegramMiniApp` currently bypasses it with a raw
`fetch`, so a pre-existing web session can cause `/auth/telegram/session` to
be rejected before pairing. Reuse the shared request/header behavior for this
flow; do not exempt Telegram endpoints in `CsrfGuardFilter`.

### Files

- Modify `apps/web/src/lib/telegram/session.ts`.
- Modify `apps/web/tests/unit/telegram.session.test.ts`.
- Modify `apps/web/tests/e2e/telegram-mini-app.spec.ts`.

### Work

1. Make the Telegram session exchange use the shared authenticated request
   mechanism (or a narrowly extracted shared CSRF-header helper) while keeping
   the configured API base URL and `credentials: 'include'` behavior.
2. Ensure the immediately following `POST /api/auth/link/telegram/complete`
   sends the CSRF value that the Telegram-session response established, and
   surface the returned error detail/reference rather than only a bare status.
3. Keep the sequence strict: raw server-verified `initData` creates the
   Telegram session first; only then may the `startParam` pairing request run.
   A failure must not silently fall back to Google sign-in or consume/clear the
   website owner’s pending challenge.
4. Add unit coverage for a pre-existing CSRF cookie and a browser E2E route
   sequence that asserts the session POST and completion POST carry the expected
   header and the completion call is accepted.

### Acceptance criteria

- With existing access/refresh/CSRF cookies, launching a Mini App with a valid
  `startParam` sends `X-CSRF-Token` matching `habbit_runner_csrf_token` on the
  Telegram session and pairing mutations; no request in the sequence returns
  403 because of a missing header.
- A fresh Telegram webview without prior cookies still authenticates and pairs
  normally.
- A 403 for a deliberately mismatched CSRF cookie/header remains a 403, proving
  CSRF protection was not bypassed.
- The retry UI remains available for a genuine authentication/pairing failure,
  without showing Google sign-in for a launch carrying `startParam`.

### Verification

```bash
cd apps/web && npm run test -- tests/unit/telegram.session.test.ts
cd apps/web && npm run test:e2e -- --project=desktop tests/e2e/telegram-mini-app.spec.ts
cd apps/web && npm run lint
```

### Commit

```bash
git add apps/web/src/lib/telegram/session.ts apps/web/tests/unit/telegram.session.test.ts apps/web/tests/e2e/telegram-mini-app.spec.ts
git commit -m "fix(telegram): Preserve CSRF during pairing"
```

## P1-1: Persist account identities and add safe provider detachment

**Status:** ✅ Completed  
**Priority:** P1  
**Depends on:** P0-1

### Outcome

The API returns the authenticated user’s Google/email and Telegram connection
details, including the verified Telegram username when available. Either
connection can be detached, but a request that would leave the user with no
sign-in method is rejected without changing data.

### Architectural decision

Extend the existing identity repository and account-link service with one
transactional connections read/detach contract. A Flyway migration adds only
the durable Telegram display metadata required by the UI. The service must also
make current Google/email logins participate in the same provider model, so the
last-provider invariant is evaluated from storage rather than from a stale JWT
email claim or browser state.

### Files

- Create `apps/backend/src/main/resources/db/migration/V14__add_auth_identity_display_metadata.sql`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AuthIdentityEntity.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/AuthIdentityRepository.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/IdentityService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AccountLinkService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/OAuthAccountLinkService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResource.java`.
- Create top-level response/request DTO files in `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/` for the consolidated connections and detach contract.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AccountLinkServiceTest.java`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResourceTest.java`.
- Modify `spec/openapi/openapi.yaml` through the repository’s OpenAPI generation check.

### Work

1. Add nullable Telegram display metadata to `auth_identities`; backfill is not
   required for historical identities that never supplied a username. On a
   verified Telegram pairing, insert or update that metadata from the verifier’s
   `TelegramWebAppUser`, never directly from request JSON.
2. Add a single authenticated connections response with fixed Google/email and
   Telegram entries. Its fields must distinguish an unlinked provider from a
   linked provider that has no Telegram username, and it must not reveal a raw
   Telegram subject or challenge token.
3. Add a protected detach operation in `AccountLinkResource` for an explicit
   provider identifier. It must validate the authenticated owner, reject an
   unknown/unlinked provider with a deterministic client error, and return 409
   with a stable error code when detaching it would remove the final login
   method.
4. In one transaction, remove only the selected provider identity; for
   Google/email also clear `users.email` and revoke sessions as required by the
   existing auth policy. Preserve the canonical user and all product data.
   Ensure future Google sign-in cannot rediscover the detached account through
   the old email column, while the remaining Telegram identity still resolves to
   the same `users.id`.
5. Update Google identity creation/linking so new and merged Google accounts
   use the same identity records as legacy migrated accounts. Do not introduce a
   parallel email-only provider count or let an account merge create duplicate
   provider subjects.
6. Document the generated request/response/error schemas with resource
   annotations, regenerate the checked-in OpenAPI snapshot, and add service and
   resource tests for details, both detach directions, last-provider rejection,
   ownership, idempotency/error semantics, and a Telegram username update.

### Acceptance criteria

- An authenticated account with both providers receives one response showing
  its Google/email connection and Telegram username (for example `@alice`)
  without a Telegram numeric ID or a pairing token.
- If Telegram is linked but has no username, the response reports it as linked
  and provides a safe fallback display state rather than incorrectly calling it
  unlinked.
- Detaching email/Google from a dual-provider account leaves Telegram able to
  authenticate to the original `users.id`; detaching Telegram leaves Google
  able to authenticate to that same `users.id`.
- A request to detach the only remaining provider returns 409 and leaves the
  identity, user, and product data unchanged.
- Unauthenticated and cross-user requests are rejected; repeated detach and
  unknown-provider requests have documented, deterministic errors.
- Flyway applies cleanly to a database that already has V13, and generated
  OpenAPI matches the checked-in snapshot.

### Verification

```bash
cd apps/backend && ./mvnw test -Dtest=AccountLinkServiceTest,AccountLinkResourceTest
cd apps/backend && ./mvnw clean verify
```

### Commit

```bash
git add apps/backend/src/main/resources/db/migration/V14__add_auth_identity_display_metadata.sql apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/AuthIdentityEntity.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/AuthIdentityRepository.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/IdentityService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AccountLinkService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/OAuthAccountLinkService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResource.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AccountLinkServiceTest.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResourceTest.java spec/openapi/openapi.yaml
git commit -m "feat(account): Manage linked identities"
```

## P1-2: De-emphasize navigation and complete the Account page

**Status:** ✅ Completed  
**Priority:** P1  
**Depends on:** P1-1

### Outcome

Account is no longer a primary desktop navigation item. The Account page shows
both connected identities, offers a clearly labeled in-card **Link Telegram**
action when Telegram is absent, opens it outside the current Account tab, and
lets the user detach a non-final provider with clear confirmation and errors.

### Architectural decision

`SidebarNav.svelte` remains the desktop navigation owner and
`MobileMoreSheet.svelte` remains the mobile utility-menu owner. Move the
desktop Account link from the primary **Navigate** group to the lower utility
area adjacent to appearance/logout, retaining the route and mobile More-sheet
entry rather than adding a dashboard shortcut or a second settings screen.
`AccountConnections.svelte` consumes the P1-1 consolidated API; it must not
infer connections from `readAuthSession().email`.

### Files

- Modify `apps/web/src/lib/api/accountLinks.ts`.
- Modify `apps/web/src/lib/components/AccountConnections.svelte`.
- Modify `apps/web/src/lib/components/SidebarNav.svelte`.
- Modify `apps/web/src/lib/components/MobileMoreSheet.svelte` only if its copy, focus behavior, or route semantics need alignment.
- Modify `apps/web/tests/unit/accountLinks.test.ts`.
- Create or modify focused component tests under `apps/web/tests/unit/` for the Account connections view.
- Modify `apps/web/tests/e2e/account-linking.spec.ts`.

### Work

1. Replace the boolean Telegram client with typed consolidated connection and
   detach calls. Refresh the server state after completion or successful
   detachment; retain pending-challenge recovery only for the short-lived
   pairing state.
2. Render two accessible provider cards. The Google/email card shows the linked
   address; the Telegram card shows the verified `@username` or an explicit
   linked-without-username fallback. Never display a numeric Telegram ID.
3. When Telegram is unlinked, place **Link Telegram** inside its card. Start
   the existing challenge, retain it in pending-link storage, and open the
   resulting `t.me?...startapp=...` destination in a new browsing context with
   safe opener isolation. Keep the current Account page open so the owner can
   return to its pending/confirmation state; handle a blocked new window with a
   visible retryable link rather than losing the challenge.
4. For a linked non-final provider, offer an explicit **Unlink** action with a
   confirmation that names the provider and warns that this sign-in method will
   stop working. Disable the action while the request is running; render the
   server’s last-provider 409 as actionable text and keep the card unchanged.
5. Remove Account from desktop primary navigation and add it as a quiet,
   keyboard-reachable utility link below the primary navigation. Preserve the
   current Account route, active indication, and mobile More-sheet access.
6. Add desktop and 320px/mobile coverage for the lower-priority navigation,
   connection states, new-window attributes/behavior, focus visibility,
   44-by-44px touch targets, loading/error/retry states, and no horizontal
   overflow.

### Acceptance criteria

- On desktop, **Account** is absent from the primary navigation group and is
  reachable as a secondary utility control; on mobile it remains reachable from
  **More** without displacing Today, Progress, or New Habit.
- A linked Google/email account displays its address; a linked Telegram account
  displays the verified username or the defined safe fallback after reload.
- When Telegram is not linked, **Link Telegram** is inside the Telegram card.
  It opens the `t.me` startapp URL in a new context and the current Account
  page remains open with its pending state intact.
- A user can unlink either provider only while another provider is linked. The
  UI handles cancellation, API failure, and final-provider 409 without showing
  a false success or hiding the actual remaining connection.
- All controls have visible keyboard focus, meaningful labels/status messages,
  and at least 44-by-44px touch targets; the Account page has no horizontal
  overflow at 320px and 390px.

### Verification

```bash
cd apps/web && npm run test -- tests/unit/accountLinks.test.ts tests/unit/AccountConnections.test.ts
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile tests/e2e/account-linking.spec.ts
cd apps/web && npm run check
```

### Commit

```bash
git add apps/web/src/lib/api/accountLinks.ts apps/web/src/lib/components/AccountConnections.svelte apps/web/src/lib/components/SidebarNav.svelte apps/web/src/lib/components/MobileMoreSheet.svelte apps/web/tests/unit/accountLinks.test.ts apps/web/tests/unit/AccountConnections.test.ts apps/web/tests/e2e/account-linking.spec.ts
git commit -m "feat(account): Streamline connections UI"
```

## P2-1: Prove the full account-linking and unlinking contract

**Status:** ✅ Completed  
**Priority:** P2  
**Depends on:** P0-1, P1-1, P1-2

### Outcome

Automated checks cover the authenticated browser path that previously returned
403, both detach directions, and responsive Account navigation. A release
checklist distinguishes local proof from the required real Telegram test.

### Architectural decision

Use the existing focused backend account-link tests and Playwright Telegram/
account specs rather than a duplicate end-to-end harness. Browser routes may
mock Telegram SDK and API responses for deterministic CI, but they cannot prove
BotFather configuration, deployed cookies, or a real Telegram webview.

### Files

- Modify `apps/web/tests/e2e/telegram-mini-app.spec.ts`.
- Modify `apps/web/tests/e2e/account-linking.spec.ts`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AccountLinkServiceTest.java` if P1-1 coverage is not complete.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResourceTest.java` if P1-1 coverage is not complete.

### Work

1. Make the Playwright deep-link test set an existing cookie session and assert
   the CSRF-correct session-to-completion sequence, pending owner confirmation,
   and an unchanged current website page when the external Telegram destination
   opens.
2. Add browser assertions for a populated Telegram username, no-username
   fallback, each unlink outcome, last-provider rejection, and primary versus
   utility navigation at desktop/compact-mobile viewport sizes.
3. Add or complete backend tests that execute the storage/service boundary for
   migration-compatible identity details, final-provider atomicity, and
   ownership. Keep clean JaCoCo verification above the configured threshold.
4. Capture the manual release test: use the official Telegram app against the
   deployed HTTPS origin, link from email to Telegram, return to the still-open
   Account page and confirm, reload, verify the same habits, then test both
   permitted unlink directions and attempted final unlink.

### Acceptance criteria

- CI-visible browser tests fail if either pairing POST drops the CSRF header or
  if a deep link replaces the Account page instead of opening externally.
- Browser and backend tests fail if an account can lose its final login method
  or if Telegram profile metadata is rendered from an unverified source.
- Local validation, production build, and E2E reports are separated from the
  recorded manual deployed Telegram evidence; no local test is presented as
  BotFather or physical-device proof.

### Verification

```bash
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile tests/e2e/telegram-mini-app.spec.ts tests/e2e/account-linking.spec.ts
cd apps/web && npm run check
cd apps/backend && ./mvnw clean verify
```

### Commit

```bash
git add apps/web/tests/e2e/telegram-mini-app.spec.ts apps/web/tests/e2e/account-linking.spec.ts apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AccountLinkServiceTest.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/AccountLinkResourceTest.java
git commit -m "test(account): Cover linking and detach flows"
```

## P2-2: Update rollout and API documentation

**Status:** ✅ Completed  
**Priority:** P2  
**Depends on:** P2-1

### Outcome

Operators and future maintainers can deploy, verify, and roll back the changed
identity behavior without exposing Telegram credentials or confusing local
checks with deployed-webview evidence.

### Architectural decision

Keep Telegram deployment instructions in the existing rollout record and API
security/contract information in the existing API document. Do not duplicate
secret setup or introduce environment-variable changes for this feature.

### Files

- Modify `docs/telegram-mini-app-rollout.md`.
- Modify `docs/architecture/api-contract.md`.

### Work

1. Document the consolidated account-connections response, provider-detach
   invariant, expected last-provider conflict, and that usernames are verified
   provider metadata rather than credentials.
2. Update the rollout checklist with the new-window Account launch, the
   owner-confirmation return path, both unlink directions, final-unlink
   rejection, and the CSRF 403 diagnostic (cookie/header match and trace ID).
3. Add a concise change record with risk and rollback: rollback the application
   release if needed, but do not reverse an applied Flyway migration; retain the
   nullable metadata column and restore the prior UI/API compatibility path.

### Acceptance criteria

- Documentation contains no bot token, real account identifier, challenge
  token, or cookie value.
- The release checklist explicitly requires a fresh remote CI run and manual
  Telegram-app validation, and clearly labels local checks as insufficient for
  those proofs.
- Rollback instructions preserve existing identities and user data.

### Verification

```bash
rg -n 'Account connections|Link Telegram|last login method|CSRF|rollback' docs/telegram-mini-app-rollout.md docs/architecture/api-contract.md
git diff --check
```

### Commit

```bash
git add docs/telegram-mini-app-rollout.md docs/architecture/api-contract.md
git commit -m "docs(account): Record connection operations"
```
