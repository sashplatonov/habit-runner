CREATE INDEX IF NOT EXISTS habits_user_sort_cursor_idx
  ON habits("userId", "sortOrder", "createdAt", id);

CREATE INDEX IF NOT EXISTS checkins_user_date_cursor_idx
  ON checkins("userId", date, id);

CREATE INDEX IF NOT EXISTS checkins_habit_user_date_idx
  ON checkins("habitId", "userId", date);
