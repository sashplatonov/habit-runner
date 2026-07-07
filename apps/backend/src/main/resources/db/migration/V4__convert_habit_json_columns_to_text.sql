-- Convert habit JSON-like columns from PostgreSQL JSONB to plain TEXT storage.
-- This keeps the API payloads as regular JSON while removing storage-specific JSONB behavior.

ALTER TABLE habits
  ALTER COLUMN "customDays" TYPE TEXT USING "customDays"::text,
  ALTER COLUMN schedule TYPE TEXT USING schedule::text,
  ALTER COLUMN tags TYPE TEXT USING tags::text,
  ALTER COLUMN "freezeDays" TYPE TEXT USING "freezeDays"::text;

ALTER TABLE habits
  ALTER COLUMN "freezeDays" SET DEFAULT '[]';
