import {
  addDaysToCalendarDate,
  calendarDateToDate,
  diffCalendarDays,
  extractCalendarDate,
  formatCalendarDateInTimeZone
} from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';
import { toCompletionKey, calendarDateToCompletionKey } from '@/lib/completionKey';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toCalendarDate(value: Date | string, timeZone: string): string {
  if (typeof value === 'string') {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return extracted;
    }
  }

  return formatCalendarDateInTimeZone(value, timeZone);
}

function shiftCalendarMonth(value: string, delta: number): string {
  const date = calendarDateToDate(value);
  date.setUTCMonth(date.getUTCMonth() + delta, 1);
  return date.toISOString().slice(0, 10);
}

function getDaysInCalendarMonth(value: string): number {
  const date = calendarDateToDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

/** @deprecated Import toCompletionKey from @/lib/completionKey instead */
export function formatDate(date: Date, timeZone = getCurrentUserTimeZone()): string {
  return toCompletionKey(date, timeZone);
}

function buildCompletedDates(
  completions: Record<string, number>,
  dailyTarget: number
): string[] {
  return Object.keys(completions)
    .filter((key) => (completions[key] ?? 0) >= dailyTarget)
    .map((key) => extractCalendarDate(key) ?? key)
    .sort();
}

function countCurrentStreak(
  completedDates: Set<string>,
  referenceDate: Date,
  timeZone: string
): number {
  let count = 0;
  for (
    let cursor = toCalendarDate(referenceDate, timeZone);
    count < 365;
    cursor = addDaysToCalendarDate(cursor, -1)
  ) {
    if (!completedDates.has(cursor)) {
      break;
    }
    count += 1;
  }
  return count;
}

function countLongestStreak(completedDates: string[]): number {
  let longest = 0;
  let temp = 0;

  for (let index = 0; index < completedDates.length; index += 1) {
    if (index === 0) {
      temp = 1;
    } else if (diffCalendarDays(completedDates[index - 1], completedDates[index]) === 1) {
      temp += 1;
    } else {
      temp = 1;
    }
    longest = Math.max(longest, temp);
  }

  return longest;
}

export function calculateStreak(
  completions: Record<string, number>,
  referenceDate = new Date(),
  dailyTarget = 1,
  timeZone = getCurrentUserTimeZone()
): { current: number; longest: number } {
  const completedDates = buildCompletedDates(completions, dailyTarget);
  const completedSet = new Set(completedDates);
  return {
    current: countCurrentStreak(completedSet, referenceDate, timeZone),
    longest: countLongestStreak(completedDates)
  };
}

export function countCompletedDays(completions: Record<string, number>, dailyTarget = 1): number {
  return Object.values(completions).filter((count) => (count ?? 0) >= dailyTarget).length;
}

export function buildWeeklyCompletionData(
  completions: Record<string, number>,
  weeks = 12,
  referenceDate = new Date(),
  dailyTarget = 1,
  timeZone = getCurrentUserTimeZone()
): { week: string; count: number }[] {
  const today = toCalendarDate(referenceDate, timeZone);
  const data = [];

  for (let weekOffset = weeks - 1; weekOffset >= 0; weekOffset -= 1) {
    let count = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const cursor = addDaysToCalendarDate(today, -(weekOffset * 7 + dayOffset));
      const key = calendarDateToCompletionKey(cursor);
      if ((completions[key] ?? 0) >= dailyTarget) {
        count += 1;
      }
    }
    const weekStart = addDaysToCalendarDate(today, -(weekOffset * 7));
    const labelDate = calendarDateToDate(weekStart);
    data.push({
      week: `W${labelDate.getUTCMonth() + 1}/${labelDate.getUTCDate()}`,
      count
    });
  }

  return data;
}

export function buildMonthlyCompletionRates(
  completions: Record<string, number>,
  months = 6,
  referenceDate = new Date(),
  dailyTarget = 1,
  timeZone = getCurrentUserTimeZone()
): { month: string; rate: number }[] {
  const today = toCalendarDate(referenceDate, timeZone);
  const todayDate = calendarDateToDate(today);
  const data = [];

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = shiftCalendarMonth(`${today.slice(0, 7)}-01`, -monthOffset);
    const daysInMonth = getDaysInCalendarMonth(monthStart);
    let completed = 0;

    for (let day = 0; day < daysInMonth; day += 1) {
      const cursor = addDaysToCalendarDate(monthStart, day);
      if (cursor > today) {
        break;
      }
      const key = calendarDateToCompletionKey(cursor);
      if ((completions[key] ?? 0) >= dailyTarget) {
        completed += 1;
      }
    }

    const monthDate = calendarDateToDate(monthStart);
    const daysElapsed =
      monthDate.getUTCFullYear() === todayDate.getUTCFullYear() && monthDate.getUTCMonth() === todayDate.getUTCMonth()
        ? todayDate.getUTCDate()
        : daysInMonth;

    data.push({
      month: MONTH_NAMES[monthDate.getUTCMonth()],
      rate: Math.round((completed / Math.max(1, daysElapsed)) * 100)
    });
  }

  return data;
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
