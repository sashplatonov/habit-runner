export const PERIOD_DAY_RANGES: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365
};

export const PERIOD_DISPLAY_NAMES: Record<string, string> = {
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year'
};

export const STREAK_THRESHOLDS = {
  AUTOMATISM_MIN: 66,
  MOMENTUM_MIN: 21
} as const;

export const WEEKDAY_NA = 'N/A';

export const STREAK_MESSAGES = {
  AUTOMATISM: (label: string, days: number) =>
    `${label} reached automatism level — ${days} consecutive days. This habit is wired in.`,
  MOMENTUM_ENCOURAGEMENT: (days: number, label: string) =>
    `${days}-day streak on ${label}! Research suggests 66 days to reach automatism.`,
  EARLY_STAGE: (days: number) =>
    `${days}-day streak so far. Keep going — consistency compounds.`,
  NO_STREAK: 'No streaks yet. Complete any habit 3 days in a row to start building a chain.'
} as const;
