ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE users
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE users
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE tombstones
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ(0);

ALTER TABLE tombstones
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(0);

UPDATE tombstones
SET "createdAt" = COALESCE("createdAt", "deletedAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", "deletedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE tombstones
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tombstones
  ALTER COLUMN "createdAt" SET NOT NULL;

ALTER TABLE tombstones
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tombstones
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE sync_op_logs
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE sync_op_logs
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE sync_op_logs
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sync_op_logs
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE oauth_states
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE oauth_states
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE oauth_states
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE oauth_states
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE refresh_tokens
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE refresh_tokens
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE refresh_tokens
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(0);

UPDATE push_subscriptions
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE push_subscriptions
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE push_subscriptions
  ALTER COLUMN "updatedAt" SET NOT NULL;
