# Habit Mutation API

This document describes the concrete habit mutation endpoints that replace the old generic sync-command write flow.

## Endpoints

- `POST /habits`
- `PUT /habits/{habitId}`
- `PATCH /habits/{habitId}/status`
- `DELETE /habits/{habitId}`

## Request DTOs

- `HabitCreateRequestDto`
- `HabitUpdateRequestDto`
- `HabitStatusUpdateRequestDto`

## Response DTO

- `HabitResponseDto`

## Contract notes

- Habit create requests carry the habit fields directly instead of wrapping them in a generic operation envelope.
- Habit updates use a dedicated partial DTO and a path parameter for the concrete habit id.
- Habit status changes use a dedicated DTO containing only the archive flag.
- Delete is a direct REST mutation and does not require a generic operation payload.
- Responses return the canonical habit snapshot so the frontend can reconcile its local state.

## Migration boundary

- The old sync push path is legacy and should not be used for habit mutations.
- Frontend habit writes should call these habit endpoints directly.
