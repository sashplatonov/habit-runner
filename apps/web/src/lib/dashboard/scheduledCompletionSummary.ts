import {
  addDaysToCalendarDate,
  formatCalendarDateInTimeZone
} from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { calendarDateToCompletionKey } from '@/lib/completionKey';
import { getHabitCompletionState } from '@/lib/habits/completionState';
import {
  getScheduleStatusForDate,
  isMandatoryForCalendarDate,
  resolveHabitSchedule
} from '@/lib/habits/schedule';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';

export type ScheduledCompletionCellState = 'neutral' | 'required';

export type ScheduledCompletionDay = {
  calendarDate: string;
  state: ScheduledCompletionCellState;
  completed: number;
  required: number;
  ratio: number | null;
  brightnessLevel: 1 | 2 | 3 | 4 | null;
};

export type ScheduledTodaySegment = {
  habitId: string;
  completed: boolean;
};

export type ScheduledTodaySummary = {
  calendarDate: string;
  completed: number;
  required: number;
  percentage: number | null;
  segments: ScheduledTodaySegment[];
};

export type ScheduledCompletionSummary = {
  days: ScheduledCompletionDay[];
  perfectDays: number;
  periodPercentage: number | null;
  today: ScheduledTodaySummary;
};

const SUMMARY_DAYS = 30;

type ScheduledCompletionDayAggregate = {
  day: ScheduledCompletionDay;
  requiredHabits: Habit[];
};

function getCalendarDates(end: string): string[] {
  const start = addDaysToCalendarDate(end, -(SUMMARY_DAYS - 1));
  return Array.from({ length: SUMMARY_DAYS }, (_, index) => addDaysToCalendarDate(start, index));
}

function getBrightnessLevel(completed: number, required: number): 1 | 2 | 3 | 4 {
  if (completed >= required) {
    return 4;
  }
  return Math.min(3, Math.max(1, Math.ceil((completed / required) * 4))) as 1 | 2 | 3;
}

function isAvailableOnDate(habit: Habit, calendarDate: string, timeZone: string): boolean {
  if (habit.archived) {
    return false;
  }
  const createdOn = formatCalendarDateInTimeZone(habit.createdAt, timeZone);
  if (calendarDate < createdOn) {
    return false;
  }
  return getScheduleStatusForDate(habit, calendarDate, timeZone) !== 'frozen';
}

function getRequiredHabits(habits: Habit[], calendarDate: string, timeZone: string): Habit[] {
  return habits.filter(
    (habit) =>
      isAvailableOnDate(habit, calendarDate, timeZone)
      && isMandatoryForCalendarDate(habit, calendarDate, timeZone, resolveHabitSchedule(habit))
  );
}

function buildDay(habits: Habit[], calendarDate: string, timeZone: string): ScheduledCompletionDayAggregate {
  const requiredHabits = getRequiredHabits(habits, calendarDate, timeZone);
  const completed = requiredHabits.filter((habit) =>
    getHabitCompletionState(habit, calendarDateToCompletionKey(calendarDate)).completed
  ).length;
  const required = requiredHabits.length;

  if (required === 0) {
    return {
      day: { calendarDate, state: 'neutral', completed: 0, required: 0, ratio: null, brightnessLevel: null },
      requiredHabits
    };
  }

  const ratio = completed / required;
  return {
    day: { calendarDate, state: 'required', completed, required, ratio, brightnessLevel: getBrightnessLevel(completed, required) },
    requiredHabits
  };
}

export function buildScheduledCompletionSummary(
  habits: Habit[],
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): ScheduledCompletionSummary {
  const todayDate = formatCalendarDateInTimeZone(referenceDate, timeZone);
  const dayAggregates = getCalendarDates(todayDate).map((calendarDate) => buildDay(habits, calendarDate, timeZone));
  const days = dayAggregates.map(({ day }) => day);
  const todayAggregate = dayAggregates[dayAggregates.length - 1];
  const today = todayAggregate.day;
  const segments = todayAggregate.requiredHabits.map((habit) => ({
    habitId: habit.id,
    completed: getHabitCompletionState(habit, calendarDateToCompletionKey(todayDate)).completed
  }));
  const periodRequired = days.reduce((total, day) => total + day.required, 0);
  const periodCompleted = days.reduce((total, day) => total + day.completed, 0);

  return {
    days,
    perfectDays: days.filter((day) => day.state === 'required' && day.completed === day.required).length,
    periodPercentage: periodRequired === 0 ? null : Math.round((periodCompleted / periodRequired) * 100),
    today: {
      calendarDate: todayDate,
      completed: today.completed,
      required: today.required,
      percentage: today.ratio === null ? null : Math.round(today.ratio * 100),
      segments
    }
  };
}

export const getScheduledCompletionSummary = buildScheduledCompletionSummary;
