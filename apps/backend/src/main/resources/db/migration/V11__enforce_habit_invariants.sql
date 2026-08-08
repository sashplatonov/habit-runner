ALTER TABLE habits
  ADD CONSTRAINT habits_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT habits_icon_length CHECK (char_length(icon) BETWEEN 1 AND 100),
  ADD CONSTRAINT habits_target_streak_positive CHECK ("targetStreak" > 0),
  ADD CONSTRAINT habits_daily_target_positive CHECK ("dailyTarget" > 0),
  ADD CONSTRAINT habits_sort_order_non_negative CHECK ("sortOrder" >= 0);

ALTER TABLE checkins
  ADD CONSTRAINT checkins_count_positive CHECK (count > 0);

ALTER TABLE habit_custom_days
  ADD CONSTRAINT habit_custom_days_range CHECK (day_value BETWEEN 1 AND 7);

ALTER TABLE habit_schedule_weekdays
  ADD CONSTRAINT habit_schedule_weekdays_range CHECK (weekday_value BETWEEN 1 AND 7);

ALTER TABLE habits
  ADD CONSTRAINT habits_schedule_week_positive CHECK (
    schedule_times_per_week IS NULL OR schedule_times_per_week BETWEEN 1 AND 7
  ),
  ADD CONSTRAINT habits_schedule_month_positive CHECK (
    schedule_times_per_month IS NULL OR schedule_times_per_month BETWEEN 1 AND 31
  );
