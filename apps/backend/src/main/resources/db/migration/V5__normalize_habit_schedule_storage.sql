ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS schedule_type TEXT,
  ADD COLUMN IF NOT EXISTS schedule_times_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS schedule_times_per_month INTEGER;

CREATE TABLE IF NOT EXISTS habit_custom_days (
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  day_value INTEGER NOT NULL,
  PRIMARY KEY (habit_id, position_index)
);

CREATE TABLE IF NOT EXISTS habit_schedule_weekdays (
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  weekday_value INTEGER NOT NULL,
  PRIMARY KEY (habit_id, position_index)
);

CREATE TABLE IF NOT EXISTS habit_schedule_weeks_of_month (
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  week_value TEXT NOT NULL,
  PRIMARY KEY (habit_id, position_index)
);

CREATE TABLE IF NOT EXISTS habit_tags (
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  tag_value TEXT NOT NULL,
  PRIMARY KEY (habit_id, position_index)
);

CREATE TABLE IF NOT EXISTS habit_freeze_days (
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  freeze_day_value TEXT NOT NULL,
  PRIMARY KEY (habit_id, position_index)
);

UPDATE habits
SET schedule_type = CASE
  WHEN schedule IS NULL OR btrim(schedule) = '' THEN NULL
  ELSE schedule::jsonb ->> 'type'
END,
    schedule_times_per_week = CASE
      WHEN schedule IS NULL OR btrim(schedule) = '' THEN NULL
      WHEN jsonb_typeof(schedule::jsonb -> 'timesPerWeek') IS NULL THEN NULL
      ELSE (schedule::jsonb ->> 'timesPerWeek')::INTEGER
    END,
    schedule_times_per_month = CASE
      WHEN schedule IS NULL OR btrim(schedule) = '' THEN NULL
      WHEN jsonb_typeof(schedule::jsonb -> 'timesPerMonth') IS NULL THEN NULL
      ELSE (schedule::jsonb ->> 'timesPerMonth')::INTEGER
    END
WHERE schedule_type IS NULL;

INSERT INTO habit_custom_days (habit_id, position_index, day_value)
SELECT h.id, source.ordinality - 1, source.value::INTEGER
FROM habits h
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN h."customDays" IS NULL OR btrim(h."customDays") = '' THEN '[]'::jsonb
    ELSE h."customDays"::jsonb
  END
) WITH ORDINALITY AS source(value, ordinality)
ON CONFLICT (habit_id, position_index) DO NOTHING;

INSERT INTO habit_schedule_weekdays (habit_id, position_index, weekday_value)
SELECT h.id, source.ordinality - 1, source.value::INTEGER
FROM habits h
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN h.schedule IS NULL OR btrim(h.schedule) = '' THEN '[]'::jsonb
    ELSE COALESCE(h.schedule::jsonb -> 'weekdays', '[]'::jsonb)
  END
) WITH ORDINALITY AS source(value, ordinality)
ON CONFLICT (habit_id, position_index) DO NOTHING;

INSERT INTO habit_schedule_weeks_of_month (habit_id, position_index, week_value)
SELECT h.id, source.ordinality - 1, source.value
FROM habits h
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN h.schedule IS NULL OR btrim(h.schedule) = '' THEN '[]'::jsonb
    ELSE COALESCE(h.schedule::jsonb -> 'weeksOfMonth', '[]'::jsonb)
  END
) WITH ORDINALITY AS source(value, ordinality)
ON CONFLICT (habit_id, position_index) DO NOTHING;

INSERT INTO habit_tags (habit_id, position_index, tag_value)
SELECT h.id, source.ordinality - 1, source.value
FROM habits h
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN h.tags IS NULL OR btrim(h.tags) = '' THEN '[]'::jsonb
    ELSE h.tags::jsonb
  END
) WITH ORDINALITY AS source(value, ordinality)
ON CONFLICT (habit_id, position_index) DO NOTHING;

INSERT INTO habit_freeze_days (habit_id, position_index, freeze_day_value)
SELECT h.id, source.ordinality - 1, source.value
FROM habits h
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN h."freezeDays" IS NULL OR btrim(h."freezeDays") = '' THEN '[]'::jsonb
    ELSE h."freezeDays"::jsonb
  END
) WITH ORDINALITY AS source(value, ordinality)
ON CONFLICT (habit_id, position_index) DO NOTHING;
