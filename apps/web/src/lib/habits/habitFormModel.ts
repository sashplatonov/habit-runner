import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
import type { HabitFrequency, HabitSchedule } from '@habbit-runner/shared';
import { calculateScheduledStreak } from '$lib/habits/schedule';
import type { Habit } from '@/types/habit';

export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKEND_DAYS = [0, 6];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DEFAULT_TARGET_STREAK = 21;
export const MAX_HABIT_DESCRIPTION_LENGTH = 8000;

export type HabitFormValues = {
  name: string;
  description: string;
  color: Habit['color'];
  icon: string;
  schedule: HabitSchedule;
  targetStreak: number;
  dailyTarget: number;
  type: Habit['type'];
  tags: string[];
  tagInput: string;
  reminderTime: string;
  reminderEnabled: boolean;
};

export type LegacyScheduleFields = {
  frequency: HabitFrequency;
  customDays?: number[];
};

export function sortWeekdays(days: number[]): number[] {
  return [...days].sort((left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right));
}

export function arraysEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export function getWeekdaysFromSchedule(current: HabitSchedule): number[] | undefined {
  if (current.type === 'weekly_days' || current.type === 'monthly_weeks') {
    return current.weekdays;
  }

  if (current.type === 'weekly_quota' || current.type === 'monthly_quota') {
    return current.weekdays;
  }

  return undefined;
}

export function buildInitialValues(source: Habit | null, defaultTargetStreak = DEFAULT_TARGET_STREAK): HabitFormValues {
  const schedule = getInitialSchedule(source);

  return {
    name: getInitialName(source),
    description: getInitialDescription(source),
    color: getInitialColor(source),
    icon: getInitialIcon(source),
    schedule,
    targetStreak: getInitialTargetStreak(source, defaultTargetStreak),
    dailyTarget: getInitialDailyTarget(source),
    type: getInitialType(source),
    tags: getInitialTags(source),
    tagInput: '',
    reminderTime: getInitialReminderTime(source),
    reminderEnabled: getInitialReminderEnabled(source)
  };
}

function getInitialName(source: Habit | null): string {
  return source?.name ?? '';
}

function getInitialDescription(source: Habit | null): string {
  return source?.description ?? '';
}

function getInitialColor(source: Habit | null): Habit['color'] {
  return source?.color ?? 'blue';
}

function getInitialIcon(source: Habit | null): string {
  return source?.icon ?? '⚡';
}

function getInitialSchedule(source: Habit | null): HabitSchedule {
  return normalizeSchedule(source?.schedule) ?? scheduleFromLegacy(source?.frequency ?? 'daily', source?.customDays) ?? { type: 'daily' };
}

function getInitialTargetStreak(source: Habit | null, defaultTargetStreak: number): number {
  return source?.targetStreak ?? defaultTargetStreak;
}

function getInitialDailyTarget(source: Habit | null): number {
  return source?.dailyTarget ?? 1;
}

function getInitialType(source: Habit | null): Habit['type'] {
  return source?.type ?? 'positive';
}

function getInitialTags(source: Habit | null): string[] {
  return source?.tags ?? [];
}

function getInitialReminderTime(source: Habit | null): string {
  return source?.reminderTime ?? '';
}

function getInitialReminderEnabled(source: Habit | null): boolean {
  return source?.reminderEnabled ?? true;
}

export function buildLegacyScheduleFields(current: HabitSchedule): LegacyScheduleFields {
  if (current.type === 'daily') {
    return { frequency: 'daily' };
  }

  const weekdays = sortWeekdays(getWeekdaysFromSchedule(current) ?? []);

  if (current.type === 'weekly_days') {
    if (arraysEqual(weekdays, DEFAULT_WEEKDAYS)) {
      return { frequency: 'weekdays' };
    }

    if (arraysEqual(weekdays, WEEKEND_DAYS)) {
      return { frequency: 'weekends' };
    }

    return {
      frequency: 'custom',
      ...(weekdays.length > 0 ? { customDays: weekdays } : {})
    };
  }

  return {
    frequency: 'custom',
    ...(weekdays.length > 0 ? { customDays: weekdays } : {})
  };
}

export function validateHabitForm(values: Pick<HabitFormValues, 'name' | 'schedule'>): Record<string, string> {
  const nextErrors: Record<string, string> = {};

  if (!values.name.trim()) {
    nextErrors.name = 'Name is required';
  } else if (values.name.trim().length > 40) {
    nextErrors.name = 'Max 40 characters';
  }

  if (values.schedule.type === 'weekly_days' && values.schedule.weekdays.length === 0) {
    nextErrors.schedule = 'Select at least one weekday';
  }

  if (values.schedule.type === 'monthly_weeks' && values.schedule.weeksOfMonth.length === 0) {
    nextErrors.scheduleWeeks = 'Select at least one week';
  }

  if (values.schedule.type === 'monthly_weeks' && values.schedule.weekdays.length === 0) {
    nextErrors.scheduleWeekdays = 'Select at least one weekday';
  }

  return nextErrors;
}

export function normalizeTags(rawTagInput: string, currentTags: string[]): string[] {
  const sanitized = rawTagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!sanitized || currentTags.includes(sanitized) || currentTags.length >= 5) {
    return currentTags;
  }
  return [...currentTags, sanitized];
}

export function areFormValuesEqual(left: HabitFormValues, right: HabitFormValues): boolean {
  return left.name === right.name
    && left.description === right.description
    && left.color === right.color
    && left.icon === right.icon
    && JSON.stringify(left.schedule) === JSON.stringify(right.schedule)
    && left.targetStreak === right.targetStreak
    && left.dailyTarget === right.dailyTarget
    && left.type === right.type
    && JSON.stringify(left.tags) === JSON.stringify(right.tags)
    && left.tagInput === right.tagInput
    && left.reminderTime === right.reminderTime
    && left.reminderEnabled === right.reminderEnabled;
}

export function calculateSoftLimitWarning(allHabits: Habit[]): boolean {
  const activeHabits = allHabits.filter((habit) => !habit.archived);
  return activeHabits.length >= 3
    && !activeHabits.some((entry) => calculateScheduledStreak(entry, entry.completions).current >= 14);
}
