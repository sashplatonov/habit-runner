import {
  addDaysToCalendarDate,
  calendarDateToDate,
  formatCalendarDateInTimeZone,
  getWeekdayFromCalendarDate
} from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { calendarDateToCompletionKey } from '@/lib/completionKey';
import { isScheduledForDate, resolveHabitSchedule } from '$lib/habits/schedule';

export type StatsWindowId = '4w' | '12w';
export type MonthPhase = 'early' | 'mid' | 'late';

export type ScheduledOpportunity = {
  habitId: string;
  calendarDate: string;
  weekday: number;
  monthKey: string;
  monthPhase: MonthPhase;
  completed: boolean;
};

export type AggregateDayPoint = {
  calendarDate: string;
  scheduledDays: number;
  completedDays: number;
};

export type StatsWindow = {
  start: string;
  end: string;
  opportunities: ScheduledOpportunity[];
  days: AggregateDayPoint[];
};

const WINDOW_LENGTHS: Record<StatsWindowId, number> = {
  '4w': 28,
  '12w': 84
};

function getDaysInMonth(calendarDate: string): number {
  const date = calendarDateToDate(calendarDate);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function getMonthPhase(calendarDate: string): MonthPhase {
  const day = Number(calendarDate.slice(8, 10));
  if (day <= 7) {
    return 'early';
  }
  if (day > getDaysInMonth(calendarDate) - 7) {
    return 'late';
  }
  return 'mid';
}

function isCompleted(habit: Habit, calendarDate: string): boolean {
  const count = habit.completions[calendarDateToCompletionKey(calendarDate)] ?? 0;
  return habit.type === 'negative' ? count === 0 : count >= Math.max(1, habit.dailyTarget ?? 1);
}

function getCalendarDates(end: string, length: number): string[] {
  const start = addDaysToCalendarDate(end, -(length - 1));
  return Array.from({ length }, (_, index) => addDaysToCalendarDate(start, index));
}

function buildWindowEndingOn(
  habits: Habit[],
  window: StatsWindowId,
  end: string,
  timeZone: string
): StatsWindow {
  const calendarDates = getCalendarDates(end, WINDOW_LENGTHS[window]);
  const dayByDate = new Map<string, AggregateDayPoint>(
    calendarDates.map((calendarDate) => [calendarDate, { calendarDate, scheduledDays: 0, completedDays: 0 }])
  );
  const opportunities: ScheduledOpportunity[] = [];

  habits.forEach((habit) => {
    const createdOn = formatCalendarDateInTimeZone(habit.createdAt, timeZone);
    const schedule = resolveHabitSchedule(habit);

    calendarDates.forEach((calendarDate) => {
      if (
        calendarDate < createdOn
        || habit.freezeDays?.includes(calendarDate)
        || !isScheduledForDate(schedule, calendarDate, timeZone)
      ) {
        return;
      }

      const completed = isCompleted(habit, calendarDate);
      opportunities.push({
        habitId: habit.id,
        calendarDate,
        weekday: (getWeekdayFromCalendarDate(calendarDate) + 6) % 7,
        monthKey: calendarDate.slice(0, 7),
        monthPhase: getMonthPhase(calendarDate),
        completed
      });

      const day = dayByDate.get(calendarDate);
      if (day) {
        day.scheduledDays += 1;
        day.completedDays += completed ? 1 : 0;
      }
    });
  });

  return {
    start: calendarDates[0] ?? end,
    end,
    opportunities,
    days: calendarDates.map((calendarDate) => dayByDate.get(calendarDate) ?? {
      calendarDate,
      scheduledDays: 0,
      completedDays: 0
    })
  };
}

export function buildStatsWindows(
  habits: Habit[],
  window: StatsWindowId,
  referenceDate: Date,
  timeZone: string
): { current: StatsWindow; previous: StatsWindow } {
  const currentEnd = formatCalendarDateInTimeZone(referenceDate, timeZone);
  const current = buildWindowEndingOn(habits, window, currentEnd, timeZone);
  const previousEnd = addDaysToCalendarDate(current.start, -1);

  return {
    current,
    previous: buildWindowEndingOn(habits, window, previousEnd, timeZone)
  };
}
