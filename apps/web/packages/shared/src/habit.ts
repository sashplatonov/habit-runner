export const HABIT_COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'cyan'] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_FREQUENCIES = ['daily', 'weekdays', 'weekends', 'custom'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_TYPES = ['positive', 'negative'] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

export type WeekOfMonth = 1 | 2 | 3 | 4 | 'last';

export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'weekly_days'; weekdays: number[] }
  | { type: 'weekly_quota'; timesPerWeek: number; weekdays?: number[] }
  | { type: 'monthly_weeks'; weeksOfMonth: WeekOfMonth[]; weekdays: number[] }
  | { type: 'monthly_quota'; timesPerMonth: number; weekdays?: number[] };
