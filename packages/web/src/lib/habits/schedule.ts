import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
import type { HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';

const COMPLETION_KEY_FORMAT = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

const FREEZE_DAY_KEY_FORMAT = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function getMonthWeekToken(isLast: boolean, week: number): WeekOfMonth {
  return isLast ? 'last' : Math.min(4, Math.max(1, week)) as Exclude<WeekOfMonth, 'last'>;
}

function dayIsCompleted(completions: Record<string, number>, date: Date, dailyTarget: number): boolean {
  return (completions[COMPLETION_KEY_FORMAT(date)] ?? 0) >= Math.max(1, dailyTarget ?? 1);
}

function isSuccessfulCompletion(
  habit: Habit,
  completions: Record<string, number>,
  key: string,
  dailyTarget: number
): boolean {
  if (habit.type === 'negative') {
    return (completions[key] ?? 0) === 0;
  }
  return (completions[key] ?? 0) >= dailyTarget;
}

function buildQuotaMatches({
  periodWindow,
  getBoundaries,
  schedule,
  habit,
  completions,
  dailyTarget,
  periodTarget
}: {
  periodWindow: number;
  getBoundaries: (offset: number) => { start: Date; end: Date };
  schedule: HabitSchedule;
  habit: Habit;
  completions: Record<string, number>;
  dailyTarget: number;
  periodTarget: number;
}): (boolean | null)[] {
  const today = ensureStartOfDay(new Date());
  const meetsTarget: (boolean | null)[] = [];

  for (let offset = 0; offset < periodWindow; offset += 1) {
    const { start, end } = getBoundaries(offset);
    if (end > today) {
      meetsTarget.push(null);
      continue;
    }

    let frozenCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateKey = FREEZE_DAY_KEY_FORMAT(cursor);
      if (isScheduledForDate(schedule, cursor) && habit.freezeDays?.includes(dateKey)) {
        frozenCount += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const adjustedTarget = Math.max(0, periodTarget - frozenCount);
    const completed = countCompletedDaysInRange(completions, start, end, dailyTarget, schedule);
    meetsTarget.push(completed >= adjustedTarget);
  }

  return meetsTarget;
}

function summarizeBooleanStreak(values: (boolean | null)[]): { current: number; longest: number; metCount: number } {
  let current = 0;
  for (const value of values) {
    if (value === true) {
      current += 1;
      continue;
    }
    break;
  }

  let longest = 0;
  let running = 0;
  for (const value of values) {
    if (value === true) {
      running += 1;
      continue;
    }
    longest = Math.max(longest, running);
    running = 0;
  }

  return {
    current,
    longest: Math.max(longest, running),
    metCount: values.filter((value) => value === true).length
  };
}

function isSkippedStreakDay(habit: Habit, schedule: HabitSchedule, date: Date): boolean {
  const freezeKey = FREEZE_DAY_KEY_FORMAT(date);
  return !isScheduledForDate(schedule, date) || habit.freezeDays?.includes(freezeKey) === true;
}

function findStreakStartDate(
  habit: Habit,
  completions: Record<string, number>,
  schedule: HabitSchedule,
  referenceDate: Date,
  dailyTarget: number
): Date {
  const today = ensureStartOfDay(new Date());
  const cursor = ensureStartOfDay(referenceDate);
  const isReferenceToday = COMPLETION_KEY_FORMAT(cursor) === COMPLETION_KEY_FORMAT(today);
  const isTodayScheduled = !isSkippedStreakDay(habit, schedule, today);
  const isTodayCompleted = isSuccessfulCompletion(habit, completions, COMPLETION_KEY_FORMAT(today), dailyTarget);
  if (!isReferenceToday || !isTodayScheduled || isTodayCompleted) {
    return cursor;
  }

  const streakStartDate = new Date(cursor);
  streakStartDate.setDate(streakStartDate.getDate() - 1);
  return streakStartDate;
}

function calculateLongestDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget
}: {
  habit: Habit;
  completions: Record<string, number>;
  schedule: HabitSchedule;
  start: Date;
  end: Date;
  dailyTarget: number;
}): number {
  let longest = 0;
  let running = 0;
  const iterator = new Date(start);

  while (iterator <= end) {
    if (isSkippedStreakDay(habit, schedule, iterator)) {
      iterator.setDate(iterator.getDate() + 1);
      continue;
    }

    const success = isSuccessfulCompletion(habit, completions, COMPLETION_KEY_FORMAT(iterator), dailyTarget);
    if (success) {
      running += 1;
    } else {
      longest = Math.max(longest, running);
      running = 0;
    }
    iterator.setDate(iterator.getDate() + 1);
  }

  return Math.max(longest, running);
}

function calculateCurrentDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget
}: {
  habit: Habit;
  completions: Record<string, number>;
  schedule: HabitSchedule;
  start: Date;
  end: Date;
  dailyTarget: number;
}): number {
  let current = 0;
  const backward = new Date(end);

  while (backward >= start) {
    if (isSkippedStreakDay(habit, schedule, backward)) {
      backward.setDate(backward.getDate() - 1);
      continue;
    }

    const success = isSuccessfulCompletion(habit, completions, COMPLETION_KEY_FORMAT(backward), dailyTarget);
    if (!success) {
      break;
    }

    current += 1;
    backward.setDate(backward.getDate() - 1);
  }

  return current;
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
      return schedule.weeksOfMonth.includes(getMonthWeekToken(isLast, week));
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
  if (habit.freezeDays?.includes(FREEZE_DAY_KEY_FORMAT(date))) {
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
  const meetsTarget = buildQuotaMatches({
    periodWindow,
    getBoundaries: (offset) => buildWeekBoundaries(referenceDate, offset),
    schedule,
    habit,
    completions,
    dailyTarget,
    periodTarget
  });
  return summarizeBooleanStreak(meetsTarget);
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
  const meetsTarget = buildQuotaMatches({
    periodWindow: MONTH_LOOKBACK,
    getBoundaries: (offset) => buildMonthBoundaries(referenceDate, offset),
    schedule,
    habit,
    completions,
    dailyTarget,
    periodTarget: schedule.timesPerMonth
  });
  return summarizeBooleanStreak(meetsTarget);
}

function calculateDailyStreak(
  habit: Habit,
  completions: Record<string, number>,
  schedule: HabitSchedule,
  referenceDate: Date
): { current: number; longest: number } {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const streakStartDate = findStreakStartDate(habit, completions, schedule, referenceDate, dailyTarget);
  const start = new Date(streakStartDate);
  start.setDate(start.getDate() - MAX_STREAK_LOOKBACK_DAYS);
  return {
    current: calculateCurrentDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget
    }),
    longest: calculateLongestDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget
    })
  };
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
