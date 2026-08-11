# API contract

The checked-in [OpenAPI snapshot](../../spec/openapi/openapi.yaml) is generated
from the Quarkus resources and DTO annotations. CI regenerates it and fails when
the generated output differs. In the local Compose stack, the same document is
available through nginx at `http://localhost:5137/api/openapi`; direct Quarkus
development exposes it at `http://localhost:3000/openapi` (or the configured
`API_PORT`).

## Security model

- The browser receives HttpOnly `habbit_runner_access_token` and
  `habbit_runner_refresh_token` cookies; the non-HttpOnly
  `habbit_runner_csrf_token` cookie is paired with the `X-CSRF-Token` header.
- The browser reaches Quarkus through the nginx `/api` proxy. The proxy removes
  `/api` before forwarding, so `/api/habits` becomes `/habits` upstream.
- `/auth/google/start`, `/auth/google/callback`, and the OpenAPI document are
  public; habit and check-in routes require the authenticated user context.
- `POST /auth/telegram/session` accepts Telegram's raw `initData`; the backend
  verifies its HMAC with the backend-only bot token, creates the same session
  cookies, and never returns the bot token.
- Account linking uses the authenticated account session plus
  `POST /auth/link/telegram/start` and `POST /auth/link/telegram/complete`.
  Completion verifies Telegram, merges the Telegram session into the account
  that created the short-lived challenge, and returns replacement auth cookies
  for that canonical account. `GET /auth/link/telegram/connection` reports the
  durable Telegram identity.
- `GET /auth/link/connections` returns `{ "connections": [{ "provider":
  "GOOGLE"|"TELEGRAM", "connected": true|false, "displayName": string|null
  }] }`. Telegram `displayName` is verified provider metadata (normally
  `@username`), never a numeric Telegram ID or credential.
- `DELETE /auth/link/connections/{provider}` detaches `google` or `telegram`.
  The server rejects removal of the final connected sign-in method with HTTP
  409 and leaves the identities unchanged.
- Authentication and validation failures use the shared `ErrorResponse` shape.

The examples below use placeholders only. Set the base URL and cookie values
from a local authenticated browser session; never copy a real token into a
commit or documentation.

```bash
API_BASE='http://localhost:5137/api'
ACCESS_TOKEN='<access-token>'
CSRF_TOKEN='<csrf-token>'
HABIT_ID='<habit-id>'
TODAY='<yyyy-mm-dd>'
```

## Request examples

List the authenticated user's habits:

```bash
curl --fail "$API_BASE/habits" \
  -b "habbit_runner_access_token=$ACCESS_TOKEN"
```

Upsert today's check-in (the `PUT` path is the durable browser-to-database
mutation):

```bash
curl --fail --request PUT "$API_BASE/checkins/habits/$HABIT_ID/dates/$TODAY" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "habbit_runner_access_token=$ACCESS_TOKEN; habbit_runner_csrf_token=$CSRF_TOKEN" \
  --data '{"done":true,"count":1}'
```

Update a habit with optimistic concurrency:

```bash
curl --fail --request PUT "$API_BASE/habits/$HABIT_ID" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "habbit_runner_access_token=$ACCESS_TOKEN; habbit_runner_csrf_token=$CSRF_TOKEN" \
  --data '{"name":"Updated habit","version":<current-version>}'
```

## Representative error responses

Validation failures return HTTP 400 with the documented `ErrorResponse` fields:

```json
{
  "type": "https://habbit-runner.dev/errors/validation",
  "title": "Bad Request",
  "status": 400,
  "detail": "name must not be blank",
  "errorCode": "VALIDATION_FAILED"
}
```

If the submitted `version` is older than the server version, the update returns
HTTP 409. The UI presents this same safe message in an accessible alert:

```json
{
  "type": "https://habbit-runner.dev/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "The resource was changed by another request",
  "errorCode": "RESOURCE_VERSION_CONFLICT"
}
```

Cursor endpoints return `items` and an optional `nextCursor`; use the generated
OpenAPI document for the complete schema rather than duplicating it here.

Telegram session/link failures use the shared `ErrorResponse` shape. Expect
HTTP 400 for malformed, expired, or incorrectly signed init data and for a
challenge owned by another account. Challenge tokens are short-lived and are
kept only for the duration of the Telegram completion request and are never
shown in the Account page.
For a pairing 403, compare the non-HttpOnly `habbit_runner_csrf_token` cookie
with the `X-CSRF-Token` request header and use the response `X-Trace-Id` when
checking server logs; do not disable CSRF checks or paste cookie values into
issues.
