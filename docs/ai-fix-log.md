# AI Fix Log

## CDE-RVW-003

- Change: Restored the complete shared compact preview on Dashboard and Identity, including behavior, goal, tags, color, and the Preview section label.
- Risk: Presentational-only change; draft state and save payload remain unchanged.
- Rollback: Revert the CDE-RVW-003 commit.

## CDE-RVW-004

- Change: Restored focused schedule detail screens for all five schedule variants with chooser/detail Back navigation and retained drafts.
- Risk: Local editor navigation and presentation changed; schedule semantics, payloads, and API contracts remain unchanged.
- Rollback: Revert the CDE-RVW-004 commit.

## CDE-RVW-005

- Change: Replaced the generic focused-panel subtitle with reference-specific context for Identity, Behavior, Schedule, Goal, Reminder, and Tags while preserving schedule-detail labels.
- Risk: Header copy and test coverage changed; panel navigation, draft state, and save behavior remain unchanged.
- Rollback: Revert the CDE-RVW-005 commit.
