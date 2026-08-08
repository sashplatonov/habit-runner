import {
  addDaysToCalendarDate,
  formatCalendarDateInTimeZone
} from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { calendarDateToCompletionKey } from '$lib/completionKey';
import {
  calculateScheduledStreak,
  getScheduleStatusForDate,
  isScheduledForDate,
  resolveHabitSchedule,
  isMandatoryToday
} from '$lib/habits/schedule';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';

export const INACTIVITY_THRESHOLD = 7;

export type DashboardMomentumStatus = {
  kind: 'flame' | 'ice' | 'none';
  streak: number;
  inactiveScheduledDays: number;
  label: string;
};

function isSuccessfulPositiveCompletion(habit: Habit, calendarDate: string): boolean {
  return (habit.completions[calendarDateToCompletionKey(calendarDate)] ?? 0)
    >= Math.max(1, habit.dailyTarget ?? 1);
}

function countScheduledMissesSinceLatestSuccess(habit: Habit, today: string, timeZone: string): number | null {
  const schedule = resolveHabitSchedule(habit);
  let misses = 0;
  let cursor = today;

  for (let index = 0; index < 366; index += 1) {
    if (habit.freezeDays?.includes(cursor)) {
      cursor = addDaysToCalendarDate(cursor, -1);
      continue;
    }
    if (isScheduledForDate(schedule, cursor, timeZone)) {
      if (isSuccessfulPositiveCompletion(habit, cursor)) {
        return misses;
      }
      misses += 1;
    }
    cursor = addDaysToCalendarDate(cursor, -1);
  }

  return null;
}

export function getDashboardMomentumStatus(
  habit: Habit,
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): DashboardMomentumStatus {
  const neutral = (label = ''): DashboardMomentumStatus => ({
    kind: 'none',
    streak: 0,
    inactiveScheduledDays: 0,
    label
  });
  const scheduleStatus = getScheduleStatusForDate(habit, referenceDate, timeZone);
  if (habit.archived || scheduleStatus !== 'scheduled' || !isMandatoryToday(habit, referenceDate, timeZone)) {
    return neutral(scheduleStatus === 'frozen' ? 'Frozen today' : 'Not scheduled today');
  }

  const streak = calculateScheduledStreak(habit, habit.completions, referenceDate, timeZone).current;
  if (streak > 0) {
    return {
      kind: 'flame',
      streak,
      inactiveScheduledDays: 0,
      label: `${streak} day streak`
    };
  }

  if (habit.type === 'negative') {
    return neutral();
  }

  const today = formatCalendarDateInTimeZone(referenceDate, timeZone);
  const inactiveScheduledDays = countScheduledMissesSinceLatestSuccess(habit, today, timeZone);
  if (inactiveScheduledDays !== null && inactiveScheduledDays >= INACTIVITY_THRESHOLD) {
    return {
      kind: 'ice',
      streak: 0,
      inactiveScheduledDays,
      label: `Inactive for ${inactiveScheduledDays} scheduled days`
    };
  }

  return neutral();
}
