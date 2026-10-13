# Session lifetime and workspace restoration

- Refresh sessions now default to 90 days instead of 30. Successful refresh rotates the token and renews this window. Access tokens retain their existing one-hour default.
- `REFRESH_TOKEN_EXPIRES_DAYS` remains supported. An explicit deployment value overrides the new default; set it to `90` to extend an existing deployment. Existing cookies receive the new lifetime on the next successful refresh or login.
- Session checks refresh expired access cookies. Network errors, timeouts, HTTP 429, and server errors during refresh no longer clear login; definitive refresh rejection still does.
- Workspace initialization shares the ongoing load. The dashboard waits for authenticated account settings instead of restoring guest defaults during a callback without a page reload. A failed load remains unconfirmed, and Retry fetches the account preferences again before the dashboard restores sort and density.
- Logout retains the user's stored preference outbox, disposes in-flight synchronization, and prevents late responses or pending changes from being applied to a different login.

Risk: the longer refresh lifetime allows a signed-in device to remain authenticated longer. Server revocation, explicit logout, CSRF protection, and token rotation remain active. No database migration is needed.

Rollback: revert this change and redeploy. Set `REFRESH_TOKEN_EXPIRES_DAYS=30` to restore the previous lifetime for newly issued refresh sessions. Preference records and pending browser changes should be preserved.

Validation covers frontend session and preference unit tests, browser restoration with a mocked API, frontend checks/build, backend tests, and both Compose configurations. Browser tests do not constitute production OAuth or deployment verification.


Verified locally:
- `cd apps/web && npm run check`: passed, using Java 25 for the backend build.
- `cd apps/web && npm run test`: 310 tests passed.
- `cd apps/backend && ./mvnw test`: 217 tests passed, using Java 25.
- `cd apps/web && PLAYWRIGHT_SKIP_BUILD=1 npm run test:e2e -- tests/e2e/session-expiry.spec.ts tests/e2e/workspace-preferences.spec.ts --project=desktop`: five tests passed against the final build with a mocked API, including callback navigation, logout/relogin, load failures, and narrow/wide viewports.
- `docker compose --env-file .env.example --profile db config --quiet` and the native configuration equivalent: passed.
