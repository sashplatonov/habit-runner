CREATE INDEX IF NOT EXISTS habits_user_updated_cursor_idx
  ON habits("userId", "updatedAt", id);

CREATE INDEX IF NOT EXISTS checkins_user_updated_cursor_idx
  ON checkins("userId", "updatedAt", id);

CREATE INDEX IF NOT EXISTS tombstones_user_deleted_cursor_idx
  ON tombstones("userId", "deletedAt", id);
