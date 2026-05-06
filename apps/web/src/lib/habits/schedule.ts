/* eslint-disable max-lines */
import {
  addDaysToCalendarDate,
  calendarDateToDate,
  diffCalendarDays,
  extractCalendarDate,
  formatCalendarDateInTimeZone,
  getWeekdayFromCalendarDate,
  normalizeSchedule,
  scheduleFromLegacy,
  toCalendarDateKey
} from '@habbit-runner/shared';
import type { HabitSchedule, WeekOfMonth } from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';

type CalendarBoundary = Date | string;
type CalendarRange = { start: string; end: string };

const MAX_STREAK_LOOKBACK_DAYS = 366;
const WEEKLY_RATE_WINDOW = 12;
const MONTH_LOOKBACK = 12;
const MONTHLY_RATE_WINDOW = 6;

function toCalendarDate(value: CalendarBoundary, timeZone: string): string {
  if (typeof value === 'string') {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return extracted;
    }
  }

  return formatCalendarDateInTimeZone(value, timeZone);
}

function toCompletionKey(value: CalendarBoundary, timeZone: string): string {
  if (typeof value === 'string') {
    const extracted = extractCalendarDate(value);
    if (extracted) {
      return `${extracted}T00:00:00Z`;
    }
  }

  return toCalendarDateKey(value, timeZone);
}

function shiftCalendarMonth(value: string, delta: number): string {
  const date = calendarDateToDate(value);
  date.setUTCMonth(date.getUTCMonth() + delta, 1);
  return toCalendarDate(date, 'UTC');
}

function getDaysInCalendarMonth(value: string): number {
  const date = calendarDateToDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}


function startOfWeek(date: Date, timeZone: string): string {
  const calendarDate = toCalendarDate(date, timeZone);
  const day = (getWeekdayFromCalendarDate(calendarDate) + 6) % 7;
  return addDaysToCalendarDate(calendarDate, -day);
}

function endOfWeek(date: Date, timeZone: string): string {
  return addDaysToCalendarDate(startOfWeek(date, timeZone), 6);
}

function startOfMonth(date: Date, timeZone: string): string {
  const calendarDate = toCalendarDate(date, timeZone);
  return `${calendarDate.slice(0, 7)}-01`;
}

function endOfMonth(date: Date, timeZone: string): string {
  const monthStart = startOfMonth(date, timeZone);
  return addDaysToCalendarDate(shiftCalendarMonth(monthStart, 1), -1);
}

function getWeekOfMonth(calendarDate: string): { week: number; isLast: boolean } {
  const first = `${calendarDate.slice(0, 7)}-01`;
  const offset = (getWeekdayFromCalendarDate(first) + 6) % 7;
  const dayOfMonth = Number(calendarDate.slice(8, 10));
  const adjusted = dayOfMonth + offset;
  const week = Math.min(4, Math.ceil(adjusted / 7));
  const monthEnd = `${calendarDate.slice(0, 7)}-${getDaysInCalendarMonth(calendarDate).toString().padStart(2, '0')}`;
  const lastWeekStart = addDaysToCalendarDate(monthEnd, -((getWeekdayFromCalendarDate(monthEnd) + 6) % 7));
  return { week, isLast: calendarDate >= lastWeekStart };
}

function getMonthWeekToken(isLast: boolean, week: number): WeekOfMonth {
  return isLast ? 'last' : (Math.min(4, Math.max(1, week)) as Exclude<WeekOfMonth, 'last'>);
}

function dayIsCompleted(
  completions: Record<string, number>,
  value: CalendarBoundary,
  dailyTarget: number,
  timeZone: string
): boolean {
  return (completions[toCompletionKey(value, timeZone)] ?? 0) >= Math.max(1, dailyTarget ?? 1);
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
  referenceDate,
  schedule,
  habit,
  completions,
  dailyTarget,
  periodTarget,
  timeZone
}: {
  periodWindow: number;
  getBoundaries: (offset: number) => CalendarRange;
  referenceDate: Date;
  schedule: HabitSchedule;
  habit: Habit;
  completions: Record<string, number>;
  dailyTarget: number;
  periodTarget: number;
  timeZone: string;
}): (boolean | null)[] {
  const referenceDay = toCalendarDate(referenceDate, timeZone);
  const meetsTarget: (boolean | null)[] = [];

  for (let offset = 0; offset < periodWindow; offset += 1) {
    const { start, end } = getBoundaries(offset);

    let frozenCount = 0;
    for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
      if (isScheduledForDate(schedule, cursor, timeZone) && habit.freezeDays?.includes(cursor)) {
        frozenCount += 1;
      }
    }

    const adjustedTarget = Math.max(0, periodTarget - frozenCount);
    const evaluationEnd = end > referenceDay ? referenceDay : end;
    const completed = countCompletedDaysInRange(completions, start, evaluationEnd, dailyTarget, schedule, timeZone);

    if (end > referenceDay && completed < adjustedTarget) {
      meetsTarget.push(null);
      continue;
    }

    meetsTarget.push(completed >= adjustedTarget);
  }

  return meetsTarget;
}

function summarizeBooleanStreak(values: (boolean | null)[]): { current: number; longest: number; metCount: number } {
  let current = 0;
  let currentStarted = false;
  for (const value of values) {
    if (value === null && !currentStarted) {
      continue;
    }
    if (value !== true) {
      break;
    }
    currentStarted = true;
    current += 1;
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

function isSkippedStreakDay(
  habit: Habit,
  schedule: HabitSchedule,
  value: CalendarBoundary,
  timeZone: string
): boolean {
  const freezeKey = toCalendarDate(value, timeZone);
  return !isScheduledForDate(schedule, freezeKey, timeZone) || habit.freezeDays?.includes(freezeKey) === true;
}

// The exported API keeps explicit args for habit math helpers, so suppress max-params here.
// eslint-disable-next-line max-params
function findStreakStartDate(
  habit: Habit,
  completions: Record<string, number>,
  schedule: HabitSchedule,
  referenceDate: Date,
  dailyTarget: number,
  timeZone: string
): string {
  const cursor = toCalendarDate(referenceDate, timeZone);

  // Decide whether the reference day should be included in streak calculations.
  // If the reference day is not scheduled or it is already completed, include it as the end.
  // If the reference day is scheduled but not completed, shift the end one day earlier
  // so the streak reflects consecutive completed scheduled days prior to the reference.
  const isCursorScheduled = !isSkippedStreakDay(habit, schedule, cursor, timeZone);
  const isCursorCompleted = isSuccessfulCompletion(habit, completions, toCompletionKey(cursor, timeZone), dailyTarget);
  if (!isCursorScheduled || isCursorCompleted) {
    return cursor;
  }

  return addDaysToCalendarDate(cursor, -1);
}

function calculateLongestDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget,
  timeZone
}: {
  habit: Habit;
  completions: Record<string, number>;
  schedule: HabitSchedule;
  start: string;
  end: string;
  dailyTarget: number;
  timeZone: string;
}): number {
  let longest = 0;
  let running = 0;

  for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (isSkippedStreakDay(habit, schedule, cursor, timeZone)) {
      continue;
    }

    if (isSuccessfulCompletion(habit, completions, toCompletionKey(cursor, timeZone), dailyTarget)) {
      running += 1;
      continue;
    }

    longest = Math.max(longest, running);
    running = 0;
  }

  return Math.max(longest, running);
}

function calculateCurrentDailyStreak({
  habit,
  completions,
  schedule,
  start,
  end,
  dailyTarget,
  timeZone
}: {
  habit: Habit;
  completions: Record<string, number>;
  schedule: HabitSchedule;
  start: string;
  end: string;
  dailyTarget: number;
  timeZone: string;
}): number {
  let current = 0;

  for (let cursor = end; cursor >= start; cursor = addDaysToCalendarDate(cursor, -1)) {
    if (isSkippedStreakDay(habit, schedule, cursor, timeZone)) {
      continue;
    }

    if (!isSuccessfulCompletion(habit, completions, toCompletionKey(cursor, timeZone), dailyTarget)) {
      break;
    }

    current += 1;
  }

  return current;
}

export function isScheduledForDate(
  schedule: HabitSchedule | undefined | null,
  value: CalendarBoundary,
  timeZone = getCurrentUserTimeZone()
): boolean {
  if (!schedule) {
    return true;
  }

  const calendarDate = toCalendarDate(value, timeZone);
  const weekday = getWeekdayFromCalendarDate(calendarDate);

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
      const { week, isLast } = getWeekOfMonth(calendarDate);
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
  date: Date,
  timeZone = getCurrentUserTimeZone()
): boolean {
  const schedule = resolveHabitSchedule(habit);
  const today = toCalendarDate(date, timeZone);

  if (!isScheduledForDate(schedule, today, timeZone)) {
    return false;
  }

  if (schedule.type === 'weekly_quota') {
    const windowStart = addDaysToCalendarDate(today, -6);
    const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
    const completed = countCompletedDaysInRange(
      habit.completions,
      windowStart,
      today,
      dailyTarget,
      undefined,
      timeZone
    );
    return completed < schedule.timesPerWeek;
  }

  if (schedule.type === 'monthly_quota') {
    const completed = countCompletedDaysInRange(
      habit.completions,
      addDaysToCalendarDate(today, -29),
      today,
      Math.max(1, habit.dailyTarget ?? 1),
      undefined,
      timeZone
    );
    return completed < schedule.timesPerMonth;
  }

  return true;
}

// eslint-disable-next-line max-params
export function countCompletedDaysInRange(
  completions: Record<string, number>,
  start: CalendarBoundary,
  end: CalendarBoundary,
  dailyTarget: number,
  schedule?: HabitSchedule,
  timeZone = getCurrentUserTimeZone()
): number {
  const startDate = toCalendarDate(start, timeZone);
  const endDate = toCalendarDate(end, timeZone);
  let count = 0;

  for (let cursor = startDate; cursor <= endDate; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (schedule && !isScheduledForDate(schedule, cursor, timeZone)) {
      continue;
    }
    if (dayIsCompleted(completions, cursor, dailyTarget, timeZone)) {
      count += 1;
    }
  }

  return count;
}

export type ScheduleDayStatus = 'scheduled' | 'unscheduled' | 'frozen';

export function resolveHabitSchedule(habit: Habit): HabitSchedule {
  return normalizeSchedule(habit.schedule) ?? scheduleFromLegacy(habit.frequency, habit.customDays);
}

export function getScheduleStatusForDate(
  habit: Habit,
  date: Date,
  timeZone = getCurrentUserTimeZone()
): ScheduleDayStatus {
  if (habit.freezeDays?.includes(toCalendarDate(date, timeZone))) {
    return 'frozen';
  }
  const schedule = resolveHabitSchedule(habit);
  return isScheduledForDate(schedule, date, timeZone) ? 'scheduled' : 'unscheduled';
}

export function getWeekRange(date: Date, timeZone = getCurrentUserTimeZone()): CalendarRange {
  return { start: startOfWeek(date, timeZone), end: endOfWeek(date, timeZone) };
}

export function getMonthRange(date: Date, timeZone = getCurrentUserTimeZone()): CalendarRange {
  return { start: startOfMonth(date, timeZone), end: endOfMonth(date, timeZone) };
}

export function getPeriodProgress(habit: Habit, date: Date, timeZone = getCurrentUserTimeZone()) {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  if (schedule.type === 'weekly_quota') {
    const { start, end } = getWeekRange(date, timeZone);
    return {
      current: countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule, timeZone),
      target: schedule.timesPerWeek,
      period: 'week'
    };
  }
  if (schedule.type === 'monthly_quota') {
    const { start, end } = getMonthRange(date, timeZone);
    return {
      current: countCompletedDaysInRange(habit.completions, start, end, dailyTarget, schedule, timeZone),
      target: schedule.timesPerMonth,
      period: 'month'
    };
  }
  return null;
}

function countScheduledDaysInRange(
  habit: Habit,
  start: string,
  end: string,
  timeZone: string
): number {
  const schedule = resolveHabitSchedule(habit);
  let count = 0;

  for (let cursor = start; cursor <= end; cursor = addDaysToCalendarDate(cursor, 1)) {
    if (isScheduledForDate(schedule, cursor, timeZone)) {
      count += 1;
    }
  }

  return count;
}

function buildWeekBoundaries(reference: Date, back: number, timeZone: string): CalendarRange {
  const base = getWeekRange(reference, timeZone);
  const shift = back * 7;
  return {
    start: addDaysToCalendarDate(base.start, -shift),
    end: addDaysToCalendarDate(base.end, -shift)
  };
}

function buildMonthBoundaries(reference: Date, back: number, timeZone: string): CalendarRange {
  const start = shiftCalendarMonth(getMonthRange(reference, timeZone).start, -back);
  return {
    start,
    end: addDaysToCalendarDate(shiftCalendarMonth(start, 1), -1)
  };
}

// eslint-disable-next-line max-params
function calculateQuotaStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate: Date,
  periodWindow: number,
  periodTarget: number,
  timeZone: string
) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  return summarizeBooleanStreak(
    buildQuotaMatches({
      periodWindow,
      getBoundaries: (offset) => buildWeekBoundaries(referenceDate, offset, timeZone),
      referenceDate,
      schedule,
      habit,
      completions,
      dailyTarget,
      periodTarget,
      timeZone
    })
  );
}

function calculateMonthlyQuotaStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate: Date,
  timeZone: string
) {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type !== 'monthly_quota') {
    return { current: 0, longest: 0, metCount: 0 };
  }
  return summarizeBooleanStreak(
    buildQuotaMatches({
      periodWindow: MONTH_LOOKBACK,
      getBoundaries: (offset) => buildMonthBoundaries(referenceDate, offset, timeZone),
      referenceDate,
      schedule,
      habit,
      completions,
      dailyTarget,
      periodTarget: schedule.timesPerMonth,
      timeZone
    })
  );
}

function calculateDailyStreak(
  habit: Habit,
  completions: Record<string, number>,
  schedule: HabitSchedule,
  referenceDate: Date,
  timeZone: string
): { current: number; longest: number } {
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const streakStartDate = findStreakStartDate(habit, completions, schedule, referenceDate, dailyTarget, timeZone);
  const start = addDaysToCalendarDate(streakStartDate, -MAX_STREAK_LOOKBACK_DAYS);
  return {
    current: calculateCurrentDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget,
      timeZone
    }),
    longest: calculateLongestDailyStreak({
      habit,
      completions,
      schedule,
      start,
      end: streakStartDate,
      dailyTarget,
      timeZone
    })
  };
}

export function calculateScheduledStreak(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): { current: number; longest: number } {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === 'weekly_quota') {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek, timeZone);
    return { current: result.current, longest: result.longest };
  }
  if (schedule.type === 'monthly_quota') {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate, timeZone);
    return { current: result.current, longest: result.longest };
  }
  return calculateDailyStreak(habit, completions, schedule, referenceDate, timeZone);
}

export function calculateScheduledCompletionRate(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): number {
  const schedule = resolveHabitSchedule(habit);
  if (schedule.type === 'weekly_quota') {
    const result = calculateQuotaStreak(habit, completions, referenceDate, WEEKLY_RATE_WINDOW, schedule.timesPerWeek, timeZone);
    return Math.round((result.metCount / WEEKLY_RATE_WINDOW) * 100);
  }
  if (schedule.type === 'monthly_quota') {
    const result = calculateMonthlyQuotaStreak(habit, completions, referenceDate, timeZone);
    return Math.round((result.metCount / MONTHLY_RATE_WINDOW) * 100);
  }
  const end = toCalendarDate(referenceDate, timeZone);
  const start = addDaysToCalendarDate(end, -29);
  const scheduledDays = countScheduledDaysInRange(habit, start, end, timeZone);
  if (scheduledDays === 0) {
    return 0;
  }
  const completed = countCompletedDaysInRange(completions, start, end, Math.max(1, habit.dailyTarget ?? 1), schedule, timeZone);
  return Math.round((completed / scheduledDays) * 100);
}

export function calculateAutomatismScore(
  habit: Habit,
  completions: Record<string, number>,
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): number {
  const consistency30d = calculateScheduledCompletionRate(habit, completions, referenceDate, timeZone) / 100;
  const { current: streak } = calculateScheduledStreak(habit, completions, referenceDate, timeZone);
  const totalCompleted = Object.values(completions).filter(
    (count) => (count ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;

  const streakFactor = Math.min(streak / 66, 1);
  const totalFactor = Math.min(totalCompleted / 100, 1);
  return Math.min(100, Math.round((consistency30d * 0.5 + streakFactor * 0.3 + totalFactor * 0.2) * 100));
}

export function getCalendarDayDistance(start: string, end: string): number {
  return diffCalendarDays(start, end);
}

export function calendarDateToUtcDate(value: string): Date {
  return calendarDateToDate(value);
}
