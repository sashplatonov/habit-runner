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
