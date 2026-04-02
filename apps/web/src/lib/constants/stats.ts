/**
 * Stats and habits configuration constants
 * Centralized configuration for all habit tracking and statistics
 */

// Period configurations for time-based stats
export const PERIOD_DAY_RANGES = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
} as const;

export const PERIOD_DISPLAY_NAMES = {
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
} as const;

// Streak thresholds for habit automatism insights
export const STREAK_THRESHOLDS = {
  AUTOMATISM_MIN: 21, // days to build lasting automatism
  MOMENTUM_MIN: 7, // days to build momentum
} as const;

// Habit status filter options
export const HABIT_STATUS_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

// Time period formatting
export const DATE_FORMATTERS = {
  MONTH_YEAR: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }),
  MONTH_SHORT: new Intl.DateTimeFormat('en-US', { month: 'short' }),
  DAY_NUMERIC: new Intl.DateTimeFormat('en-US', { day: 'numeric' }),
  MONTH_DAY: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
  MONTH_YEAR_SHORT: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }),
} as const;

// Color and styling constants
export const THEME_COLORS = {
  FROZEN_BLUE: 'rgb(96 165 250)',
  NO_DATA: 'var(--border)',
} as const;

// Time window defaults for habit details
export const RATE_WINDOW_DEFAULTS = {
  DEFAULT_DAYS: 30,
  SHORT_FORMAT_THRESHOLD: 30, // days before showing as "30 days" instead of exact count
} as const;

// Weekday constants
export const WEEKDAY_NA = 'N/A';

// Text content for streaks (could be moved to i18n later)
export const STREAK_MESSAGES = {
  AUTOMATISM: (habit: string, days: number) =>
    `${habit} has ${days} days — this habit is becoming automatic.`,
  MOMENTUM_ENCOURAGEMENT: (days: number, habit: string) =>
    `${days} days on ${habit}. Aim for 21+ to build lasting automatism.`,
  EARLY_STAGE: (days: number) => `Best streak is ${days} days. Complete any habit 7 days in a row to build momentum.`,
  NO_STREAK: 'Start a streak by completing your first habit.',
} as const;

// Chart-related defaults
export const CHART_DEFAULTS = {
  TOOLTIP_DECIMAL_PLACES: 0,
  TOOLTIP_SUFFIX: '%',
} as const;
