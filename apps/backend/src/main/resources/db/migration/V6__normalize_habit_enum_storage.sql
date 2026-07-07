UPDATE habits
SET color = CASE color
  WHEN 'blue' THEN 'BLUE'
  WHEN 'green' THEN 'GREEN'
  WHEN 'purple' THEN 'PURPLE'
  WHEN 'orange' THEN 'ORANGE'
  WHEN 'red' THEN 'RED'
  WHEN 'cyan' THEN 'CYAN'
  WHEN '#5E81AC' THEN 'LEGACY_NORD'
  WHEN '#1F2937' THEN 'LEGACY_SLATE'
  WHEN '#111827' THEN 'LEGACY_CHARCOAL'
  ELSE color
END;

UPDATE habits
SET frequency = CASE frequency
  WHEN 'daily' THEN 'DAILY'
  WHEN 'weekdays' THEN 'WEEKDAYS'
  WHEN 'weekends' THEN 'WEEKENDS'
  WHEN 'custom' THEN 'CUSTOM'
  ELSE frequency
END;

UPDATE habits
SET type = CASE type
  WHEN 'positive' THEN 'POSITIVE'
  WHEN 'negative' THEN 'NEGATIVE'
  ELSE type
END;

UPDATE habits
SET schedule_type = CASE schedule_type
  WHEN 'daily' THEN 'DAILY'
  WHEN 'weekly_days' THEN 'WEEKLY_DAYS'
  WHEN 'weekly_quota' THEN 'WEEKLY_QUOTA'
  WHEN 'monthly_weeks' THEN 'MONTHLY_WEEKS'
  WHEN 'monthly_quota' THEN 'MONTHLY_QUOTA'
  ELSE schedule_type
END;

UPDATE habit_schedule_weeks_of_month
SET week_value = CASE week_value
  WHEN '1' THEN 'FIRST'
  WHEN '2' THEN 'SECOND'
  WHEN '3' THEN 'THIRD'
  WHEN '4' THEN 'FOURTH'
  WHEN 'last' THEN 'LAST'
  ELSE week_value
END;
