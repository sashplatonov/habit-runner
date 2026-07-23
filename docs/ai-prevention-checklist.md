# AI Prevention Checklist

- Use the repository's configured Vitest matchers; do not assume `@testing-library/jest-dom` is installed.
- Coalesce concurrent authentication refreshes, keep the CSRF token stable for a refresh
  session, and reject stale refresh responses after session changes.
