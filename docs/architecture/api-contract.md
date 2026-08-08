# API contract

The checked-in OpenAPI document at `spec/openapi/openapi.yaml` is generated
from the Quarkus resources and DTO annotations. It is a reviewable snapshot;
the CI workflow regenerates it and fails when the generated output differs.

## Security model

- Browser sessions use the `access_token` and `refresh_token` HttpOnly cookies.
- State-changing cookie-authenticated requests also require the `X-CSRF-Token`
  header matching the CSRF cookie.
- `/auth/google/start` and `/auth/google/callback` are public OAuth endpoints.
- Authenticated habit, check-in, and notification routes require the current
  user context; API failures use the shared `ErrorResponse` schema.

## Request examples

Read the authenticated habit list:

```bash
curl -b 'access_token=<token>' https://example.test/api/habits
```

Create a habit:

```bash
curl -X POST -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <csrf-token>' -b 'access_token=<token>; csrf_token=<csrf-token>' \
  --data '{"id":"habit-read","name":"Read","color":"blue","icon":"book","frequency":"daily","targetStreak":1,"dailyTarget":1,"type":"positive"}' \
  https://example.test/api/habits
```

Handle a stale-version conflict:

```bash
curl -X PUT -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <csrf-token>' -b 'access_token=<token>; csrf_token=<csrf-token>' \
  --data '{"name":"Read more","version":1}' \
  https://example.test/api/habits/habit-read
```

The last request returns HTTP 409 with `errorCode` set to
`RESOURCE_VERSION_CONFLICT` when another writer has already changed the
resource. Cursor endpoints return `items` and an optional `nextCursor`.
