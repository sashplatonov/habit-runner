# Current Limitations

- Habit and check-in mutations require an authenticated network connection;
  the PWA caches the app shell but does not provide offline habit logging.
- Google OAuth is the supported sign-in provider. Local UI tests use deterministic
  fixtures and do not simulate a real provider account.
- Playwright E2E runs against a production build with API route stubs. It proves
  browser behavior and responsive journeys, not a real browser-to-Quarkus-to-
  PostgreSQL session.
- New Relic metrics export is opt-in and requires deployment credentials.
  OpenTelemetry is disabled by default; trace IDs provide request correlation.
- There is no automated production deployment, remote CI result, or Dokploy
  runtime proof in this checkout.
- Database rollback is an operator procedure; Flyway migrations are forward-only
  and require backup planning for destructive changes.
