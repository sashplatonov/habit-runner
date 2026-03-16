import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
import type { HabitSchedule } from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';

const DAY_KEY_FORMAT = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getWeekOfMonth(date: Date): { week: number; isLast: boolean } {
  const first = startOfMonth(date);
  const offset = (first.getDay() + 6) % 7;
  const dayOfMonth = date.getDate();
  const adjusted = dayOfMonth + offset;
  const week = Math.min(4, Math.ceil(adjusted / 7));
  const lastWeekStart = startOfWeek(endOfMonth(date));
  return { week, isLast: date >= lastWeekStart };
}

function dayIsCompleted(completions: Record<string, number>, date: Date, dailyTarget: number): boolean {
  return (completions[DAY_KEY_FORMAT(date)] ?? 0) >= Math.max(1, dailyTarget ?? 1);
}

export function isScheduledForDate(schedule: HabitSchedule | undefined | null, date: Date): boolean {
  if (!schedule) {
    return true;
  }
  const weekday = date.getDay();
  switch (schedule.type) {
    case 'daily':
      return true;
    case 'weekly_days':
      return schedule.weekdays.includes(weekday);
    case 'weekly_quota':
      return schedule.weekdays ? schedule.weekdays.includes(weekday) : true;
    case 'monthly_weeks': {
      if (!schedule.weekdays.includes(weekday)) {
        return false;
      }
      const { week, isLast } = getWeekOfMonth(date);
      return schedule.weeksOfMonth.includes((isLast ? 'last' : week) as any);
    }
    case 'monthly_quota':
      return schedule.weekdays ? schedule.weekdays.includes(weekday) : true;
    default:
      return true;
  }
}

export function isMandatoryToday(
  habit: Habit,
  date: Date
): boolean {
  const schedule = resolveHabitSchedule(habit);

  // First check if it matches the schedule pattern
  if (!isScheduledForDate(schedule, date)) {
    return false;
  }

  // For quota-based habits, check if quota is already met using rolling window
  if (schedule.type === 'weekly_quota') {
    // Use rolling window: last 7 days (not current calendar week)
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(date);
    start.setDate(start.getDate() - 6); // 7 days including today
    start.setHours(0, 0, 0, 0);

    const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
    const completed = countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule);
    return completed < schedule.timesPerWeek;
  }

  if (schedule.type === 'monthly_quota') {
    // Use rolling window: last 30 days (not current calendar month)
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(date);
    start.setDate(start.getDate() - 29); // 30 days including today
    start.setHours(0, 0, 0, 0);

    const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
    const completed = countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule);
    return completed < schedule.timesPerMonth;
  }

  return true;
}

export function countCompletedDaysInRange(
  completions: Record<string, number>,
  start: Date,
  end: Date,
  dailyTarget: number,
  schedule?: HabitSchedule
): number {
  const cursor = new Date(start);
  let count = 0;
  while (cursor <= end) {
    if (schedule && !isScheduledForDate(schedule, cursor)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (dayIsCompleted(completions, cursor, dailyTarget)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export type ScheduleDayStatus = 'scheduled' | 'unscheduled' | 'frozen';

export function resolveHabitSchedule(habit: Habit): HabitSchedule {
  return normalizeSchedule(habit.schedule) ?? scheduleFromLegacy(habit.frequency, habit.customDays);
}

export function getScheduleStatusForDate(habit: Habit, date: Date): ScheduleDayStatus {
  if (habit.freezeDays?.includes(DAY_KEY_FORMAT(date))) {
    return 'frozen';
  }
  const schedule = resolveHabitSchedule(habit);
  return isScheduledForDate(schedule, date) ? 'scheduled' : 'unscheduled';
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return { start: startOfWeek(date), end: endOfWeek(date) };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getPeriodProgress(habit: Habit, date: Date) {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  if (schedule.type === 'weekly_quota') {
    const { start, end } = getWeekRange(date);
    const completed = countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule);
    return {
      current: completed,
      target: schedule.timesPerWeek,
      period: 'week'
    };
  }
  if (schedule.type === 'monthly_quota') {
    const { start, end } = getMonthRange(date);
    const completed = countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule);
    return {
      current: completed,
      target: schedule.timesPerMonth,
      period: 'month'
    };
  }
  return null;
}

const MAX_STREAK_LOOKBACK_DAYS = 366;
const WEEKLY_RATE_WINDOW = 12;
const MONTH_LOOKBACK = 12;
const MONTHLY_RATE_WINDOW = 6;

function ensureStartOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function countScheduledDaysInRange(habit: Habit, start: Date, end: Date): number {
  const schedule = resolveHabitSchedule(habit);
  const cursor = new Date(start);
  let count = 0;
  while (cursor <= end) {
    if (isScheduledForDate(schedule, cursor)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function buildWeekBoundaries(reference: Date, back: number) {
  const base = getWeekRange(reference);
  const start = new Date(base.start);
  start.setDate(start.getDate() - back * 7);
  const end = new Date(base.end);
  end.setDate(end.getDate() - back * 7);
  return { start, end };
}

function buildMonthBoundaries(reference: Date, back: number) {
  const baseStart = getMonthRange(reference).start;
  const start = new Date(baseStart);
  start.setMonth(start.getMonth() - back);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function calculateQuotaStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate: Date,
  periodWindow: number,
  periodTarget: number
) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  const today = ensureStartOfDay(new Date());
  const meetsTarget: (boolean | null)[] = [];

  for (let offset = 0; offset < periodWindow; offset += 1) {
    const { start, end } = buildWeekBoundaries(referenceDate, offset);

    // Skip current unfinished period - if week end is in the future, it's ongoing
    if (end > today) {
      meetsTarget.push(null); // null means "ongoing, not yet counted"
      continue;
    }

    // Count frozen scheduled days and adjust target
    let frozenCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateKey = DAY_KEY_FORMAT(cursor);
      if (isScheduledForDate(schedule, cursor) && habit.freezeDays?.includes(dateKey)) {
        frozenCount += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    const adjustedTarget = Math.max(0, periodTarget - frozenCount);

    const completed = countCompletedDaysInRange(completions, start, end, dailyTarget, schedule);
    meetsTarget.push(completed >= adjustedTarget);
  }

  let current = 0;
  for (let i = 0; i < meetsTarget.length; i += 1) {
    if (meetsTarget[i] === true) {
      current += 1;
    } else {
      break;
    }
  }

  let longest = 0;
  let running = 0;
  for (let i = 0; i < meetsTarget.length; i += 1) {
    if (meetsTarget[i] === true) {
      running += 1;
    } else {
      longest = Math.max(longest, running);
      running = 0;
    }
  }
  longest = Math.max(longest, running);
  const metCount = meetsTarget.filter(v => v === true).length;
  return { current, longest, metCount };
}

function calculateMonthlyQuotaStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate: Date
) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type !== 'monthly_quota') {
    return { current: 0, longest: 0, metCount: 0 };
  }
  const today = ensureStartOfDay(new Date());
  const meetsTarget: (boolean | null)[] = [];

  for (let offset = 0; offset < MONTH_LOOKBACK; offset += 1) {
    const { start, end } = buildMonthBoundaries(referenceDate, offset);

    // Skip current unfinished period - if month end is in the future, it's ongoing
    if (end > today) {
      meetsTarget.push(null); // null means "ongoing, not yet counted"
      continue;
    }

    // Count frozen scheduled days and adjust target
    let frozenCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateKey = DAY_KEY_FORMAT(cursor);
      if (isScheduledForDate(schedule, cursor) && habit.freezeDays?.includes(dateKey)) {
        frozenCount += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    const adjustedTarget = Math.max(0, schedule.timesPerMonth - frozenCount);

    const completed = countCompletedDaysInRange(completions, start, end, dailyTarget, schedule);
    meetsTarget.push(completed >= adjustedTarget);
  }

  let current = 0;
  for (let i = 0; i < meetsTarget.length; i += 1) {
    if (meetsTarget[i] === true) {
      current += 1;
    } else {
      break;
    }
  }

  let longest = 0;
  let running = 0;
  for (let i = 0; i < meetsTarget.length; i += 1) {
    if (meetsTarget[i] === true) {
      running += 1;
    } else {
      longest = Math.max(longest, running);
      running = 0;
    }
  }
  longest = Math.max(longest, running);
  const metCount = meetsTarget.filter(v => v === true).length;
  return { current, longest, metCount };
}

function calculateDailyStreak(
  habit: Habit,
  completions: Record<string, number>,
  schedule: HabitSchedule,
  referenceDate: Date
): { current: number; longest: number } {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const cursor = ensureStartOfDay(referenceDate);
  const start = new Date(cursor);
  start.setDate(start.getDate() - MAX_STREAK_LOOKBACK_DAYS);

  // Check if referenceDate is today, is scheduled, and not yet completed
  const today = ensureStartOfDay(new Date());
  const todayKey = DAY_KEY_FORMAT(today);
  const isToday = DAY_KEY_FORMAT(cursor) === todayKey;
  const isTodayScheduled = isScheduledForDate(schedule, today) && !habit.freezeDays?.includes(todayKey);
  const isTodayCompleted =
    habit.type === 'negative'
      ? (completions[todayKey] ?? 0) === 0
      : (completions[todayKey] ?? 0) >= dailyTarget;

  // If today is scheduled but not completed, start "current" streak from yesterday
  const streakStartDate = isToday && isTodayScheduled && !isTodayCompleted
    ? new Date(cursor) // will subtract 1 day below
    : cursor;

  if (isToday && isTodayScheduled && !isTodayCompleted) {
    streakStartDate.setDate(streakStartDate.getDate() - 1);
  }

  let longest = 0;
  let running = 0;
  const iterator = new Date(start);
  while (iterator <= streakStartDate) {
    const key = DAY_KEY_FORMAT(iterator);
    if (!isScheduledForDate(schedule, iterator) || habit.freezeDays?.includes(key)) {
      iterator.setDate(iterator.getDate() + 1);
      continue;
    }
    const success = habit.type === 'negative'
      ? (completions[key] ?? 0) === 0
      : (completions[key] ?? 0) >= dailyTarget;

    if (success) {
      running += 1;
    } else {
      longest = Math.max(longest, running);
      running = 0;
    }
    iterator.setDate(iterator.getDate() + 1);
  }
  longest = Math.max(longest, running);

  let current = 0;
  const backward = new Date(streakStartDate);
  while (backward >= start) {
    const key = DAY_KEY_FORMAT(backward);
    if (!isScheduledForDate(schedule, backward) || habit.freezeDays?.includes(key)) {
      backward.setDate(backward.getDate() - 1);
      continue;
    }
    const success = habit.type === 'negative'
      ? (completions[key] ?? 0) === 0
      : (completions[key] ?? 0) >= dailyTarget;

    if (success) {
      current += 1;
      backward.setDate(backward.getDate() - 1);
      continue;
    }
    break;
  }
  return { current, longest };
}

export function calculateScheduledStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date()
): { current: number; longest: number } {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === 'weekly_quota') {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek);
    return { current: result.current, longest: result.longest };
  }
  if (schedule.type === 'monthly_quota') {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate);
    return { current: result.current, longest: result.longest };
  }
  return calculateDailyStreak(habit, completions, schedule, referenceDate);
}

export function calculateScheduledCompletionRate(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date()
): number {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === 'weekly_quota') {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek);
    return Math.round((result.metCount / WEEKLY_RATE_WINDOW) * 100);
  }
  if (schedule.type === 'monthly_quota') {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate);
    return Math.round((result.metCount / MONTHLY_RATE_WINDOW) * 100);
  }
  const windowSize = 30;
  const end = ensureStartOfDay(referenceDate);
  const start = new Date(end);
  start.setDate(start.getDate() - (windowSize - 1));
  const scheduledDays = countScheduledDaysInRange(habit, start, end);
  if (scheduledDays === 0) {
    return 0;
  }
  const completed = countCompletedDaysInRange(completions, start, end, Math.max(1, habit.dailyTarget ?? 1), schedule);
  return Math.round((completed / scheduledDays) * 100);
}

export function calculateAutomatismScore(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date()
): number {
  const consistency30d = calculateScheduledCompletionRate(habit, completions, referenceDate) / 100;
  const { current: streak } = calculateScheduledStreak(habit, completions, referenceDate);
  
  // Total completed days count
  const totalCompleted = Object.values(completions).filter(
    (count) => (count ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;

  const streakFactor = Math.min(streak / 66, 1);
  const totalFactor = Math.min(totalCompleted / 100, 1);

  // Formula: 50% consistency + 30% streak + 20% total volume
  const score = (consistency30d * 0.5 + streakFactor * 0.3 + totalFactor * 0.2) * 100;
  return Math.min(100, Math.round(score));
}

