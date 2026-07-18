import { diffCalendarDays, extractCalendarDate, formatCalendarDateInTimeZone } from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';
import { toCompletionKey } from '@/lib/completionKey';

function toCalendarDate(value: Date | string, timeZone: string): string {
  if (typeof value === 'string') {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return extracted;
    }
  }

  return formatCalendarDateInTimeZone(value, timeZone);
}

/** @deprecated Import toCompletionKey from @/lib/completionKey instead */
export function formatDate(date: Date, timeZone = getCurrentUserTimeZone()): string {
  return toCompletionKey(date, timeZone);
}

export function countCompletedDays(completions: Record<string, number>, dailyTarget = 1): number {
  return Object.values(completions).filter((count) => (count ?? 0) >= dailyTarget).length;
}

export function getDaysSinceLastCompletion(
  habits: { completions: Record<string, number>; dailyTarget: number }[],
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): number {
  if (habits.length === 0) {
    return 0;
  }

  const today = toCalendarDate(referenceDate, timeZone);
  const allCompletions = new Set<string>();

  habits.forEach((habit) => {
    const target = Math.max(1, habit.dailyTarget ?? 1);
    Object.keys(habit.completions).forEach((dateKey) => {
      const calendarDate = extractCalendarDate(dateKey);
      if (calendarDate && (habit.completions[dateKey] ?? 0) >= target && calendarDate < today) {
        allCompletions.add(calendarDate);
      }
    });
  });

  if (allCompletions.size === 0) {
    return 0;
  }

  const mostRecent = Array.from(allCompletions).sort((first, second) => second.localeCompare(first))[0];
  return diffCalendarDays(mostRecent, today);
}
