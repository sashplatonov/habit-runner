ALTER TABLE habits ALTER COLUMN version TYPE bigint USING version::bigint;
ALTER TABLE checkins ALTER COLUMN version TYPE bigint USING version::bigint;
ALTER TABLE tombstones ALTER COLUMN version TYPE bigint USING version::bigint;
