export const HABIT_COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'cyan'] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_FREQUENCIES = ['daily', 'weekdays', 'weekends', 'custom'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];
