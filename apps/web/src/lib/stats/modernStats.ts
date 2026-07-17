import { addDaysToCalendarDate, calendarDateToDate, getWeekdayFromCalendarDate } from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { formatAppDate } from '@/lib/i18n';
import { calculateScheduledStreak } from '$lib/habits/schedule';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';
import {
  buildStatsWindows,
  type AggregateDayPoint,
  type ScheduledOpportunity,
  type StatsWindowId
} from './opportunities';
import { findTemporalPattern, type TemporalPatternSummary } from './temporalPatterns';

export type { StatsWindowId } from './opportunities';
export type { TemporalPatternSummary } from './temporalPatterns';

export type CompletionWindowPoint = {
  label: string;
  completionRate: number;
  completedDays: number;
  scheduledDays: number;
};

export type HabitFocusCard = {
  id: string;
  habit: Habit;
  completionRate: number;
  completionDelta: number | null;
  currentStreak: number;
  longestStreak: number;
  milestone: number | null;
  focus: 'strong' | 'growing' | 'support';
  label: string;
};

export type ModernStatsSnapshot = {
  window: StatsWindowId;
  windowLabel: string;
  momentum: number | null;
  weeklyProgress: number | null;
  trendDelta: number | null;
  trendLabel: 'rising' | 'slipping' | 'steady' | 'insufficient-data';
  trendSample: { current: number; previous: number };
  nextMilestone: number | null;
  comebackLabel: string;
  totalScheduled: number;
  totalCompleted: number;
  focusHabits: HabitFocusCard[];
  pattern: TemporalPatternSummary | null;
  history: CompletionWindowPoint[];
};

const MILESTONES = [3, 7, 14, 21, 30, 60, 100] as const;
const MIN_MOMENTUM_SAMPLE = 5;
const MOMENTUM_WINDOW = 14;
const MIN_TREND_SAMPLE = 5;

function getRate(completed: number, scheduled: number): number | null {
  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : null;
}

function rateFor(points: ScheduledOpportunity[]): number {
  return getRate(points.filter((point) => point.completed).length, points.length) ?? 0;
}

function getMomentum(points: ScheduledOpportunity[]): number | null {
  const recent = [...points]
    .sort((left, right) => left.calendarDate.localeCompare(right.calendarDate))
    .slice(-MOMENTUM_WINDOW);
  if (recent.length < MIN_MOMENTUM_SAMPLE) {
    return null;
  }

  const weighted = recent.reduce((sum, point, index) => {
    const weight = 1 + index / Math.max(1, recent.length - 1);
    return sum + (point.completed ? weight : 0);
  }, 0);
  const maximum = recent.reduce(
    (sum, _point, index) => sum + (1 + index / Math.max(1, recent.length - 1)),
    0
  );
  return Math.round((weighted / maximum) * 100);
}

function formatCalendarLabel(calendarDate: string): string {
  return formatAppDate(calendarDateToDate(calendarDate), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function buildHistory(points: AggregateDayPoint[]): CompletionWindowPoint[] {
  const buckets: CompletionWindowPoint[] = [];
  for (let index = 0; index < points.length; index += 7) {
    const chunk = points.slice(index, index + 7);
    const completedDays = chunk.reduce((sum, point) => sum + point.completedDays, 0);
    const scheduledDays = chunk.reduce((sum, point) => sum + point.scheduledDays, 0);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    buckets.push({
      label: first && last
        ? `${formatCalendarLabel(first.calendarDate)} - ${formatCalendarLabel(last.calendarDate)}`
        : `Week ${buckets.length + 1}`,
      completedDays,
      scheduledDays,
      completionRate: getRate(completedDays, scheduledDays) ?? 0
    });
  }
  return buckets;
}

function getWeeklyProgress(points: AggregateDayPoint[]): number | null {
  const latest = points[points.length - 1];
  if (!latest) {
    return null;
  }
  const weekday = (getWeekdayFromCalendarDate(latest.calendarDate) + 6) % 7;
  const weekStart = addDaysToCalendarDate(latest.calendarDate, -weekday);
  const currentWeek = points.filter((point) => point.calendarDate >= weekStart);
  const completed = currentWeek.reduce((sum, point) => sum + point.completedDays, 0);
  const scheduled = currentWeek.reduce((sum, point) => sum + point.scheduledDays, 0);
  return getRate(completed, scheduled);
}

function getTrend(
  current: ScheduledOpportunity[],
  previous: ScheduledOpportunity[]
): Pick<ModernStatsSnapshot, 'trendDelta' | 'trendLabel' | 'trendSample'> {
  const trendSample = { current: current.length, previous: previous.length };
  if (current.length < MIN_TREND_SAMPLE || previous.length < MIN_TREND_SAMPLE) {
    return { trendDelta: null, trendLabel: 'insufficient-data', trendSample };
  }

  const trendDelta = rateFor(current) - rateFor(previous);
  return {
    trendDelta,
    trendLabel: trendDelta >= 8 ? 'rising' : trendDelta <= -8 ? 'slipping' : 'steady',
    trendSample
  };
}

function summarizeHabit(
  habit: Habit,
  window: StatsWindowId,
  referenceDate: Date,
  timeZone: string
): Omit<HabitFocusCard, 'focus' | 'label'> {
  const { current, previous } = buildStatsWindows([habit], window, referenceDate, timeZone);
  const completionRate = rateFor(current.opportunities);
  const previousRate = previous.opportunities.length >= MIN_TREND_SAMPLE
    ? rateFor(previous.opportunities)
    : null;
  const streak = calculateScheduledStreak(habit, habit.completions, referenceDate, timeZone);

  return {
    id: habit.id,
    habit,
    completionRate,
    completionDelta: previousRate === null ? null : completionRate - previousRate,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    milestone: MILESTONES.find((milestone) => milestone > streak.current) ?? null
  };
}

function selectFocusHabits(
  habits: Habit[],
  window: StatsWindowId,
  referenceDate: Date,
  timeZone: string
): HabitFocusCard[] {
  const summaries = habits.map((habit) => summarizeHabit(habit, window, referenceDate, timeZone));
  const selected = new Map<string, HabitFocusCard>();
  const add = (
    candidate: Omit<HabitFocusCard, 'focus' | 'label'> | undefined,
    focus: HabitFocusCard['focus'],
    label: string
  ) => {
    if (candidate && !selected.has(candidate.id)) {
      selected.set(candidate.id, { ...candidate, focus, label });
    }
  };

  add([...summaries].sort((left, right) => right.completionRate - left.completionRate)[0], 'strong', 'Strong rhythm');
  add(
    [...summaries].filter((habit) =>
      !selected.has(habit.id) && habit.completionDelta !== null && habit.completionDelta > 0
    )
      .sort((left, right) => (right.completionDelta ?? 0) - (left.completionDelta ?? 0))[0],
    'growing',
    'Growing'
  );
  add(
    [...summaries].filter((habit) => !selected.has(habit.id))
      .sort((left, right) => left.completionRate - right.completionRate)[0],
    'support',
    'Needs support'
  );

  summaries.forEach((summary) => add(summary, 'support', 'Keep moving'));
  return [...selected.values()].slice(0, 3);
}

function getComebackLabel(points: ScheduledOpportunity[], completed: number, scheduled: number): string {
  const byHabit = new Map<string, ScheduledOpportunity[]>();
  points.forEach((point) => byHabit.set(point.habitId, [...(byHabit.get(point.habitId) ?? []), point]));

  const recoveries: { date: string; misses: number }[] = [];
  byHabit.forEach((sequence) => {
    let misses = 0;
    sequence.sort((left, right) => left.calendarDate.localeCompare(right.calendarDate)).forEach((point) => {
      if (!point.completed) {
        misses += 1;
      } else if (misses >= 2) {
        recoveries.push({ date: point.calendarDate, misses });
        misses = 0;
      } else {
        misses = 0;
      }
    });
  });

  const latestRecovery = recoveries.sort((left, right) => right.date.localeCompare(left.date))[0];
  if (latestRecovery) {
    return `You came back after ${latestRecovery.misses} missed opportunities`;
  }
  const rate = getRate(completed, scheduled);
  return rate === null ? 'No scheduled opportunities yet' : `${rate}% of scheduled chances completed`;
}

export function buildModernStatsSnapshot(
  habits: Habit[],
  window: StatsWindowId = '12w',
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone()
): ModernStatsSnapshot {
  const activeHabits = habits.filter((habit) => !habit.archived);
  const { current, previous } = buildStatsWindows(activeHabits, window, referenceDate, timeZone);
  const history = buildHistory(current.days);
  const totalScheduled = current.opportunities.length;
  const totalCompleted = current.opportunities.filter((point) => point.completed).length;
  const focusHabits = selectFocusHabits(activeHabits, window, referenceDate, timeZone);
  const strongestStreak = Math.max(0, ...focusHabits.map((habit) => habit.currentStreak));

  return {
    window,
    windowLabel: window === '4w' ? 'Last 4 weeks' : 'Last 12 weeks',
    momentum: getMomentum(current.opportunities),
    weeklyProgress: getWeeklyProgress(current.days),
    ...getTrend(current.opportunities, previous.opportunities),
    nextMilestone: MILESTONES.find((milestone) => milestone > strongestStreak) ?? null,
    comebackLabel: getComebackLabel(current.opportunities, totalCompleted, totalScheduled),
    totalScheduled,
    totalCompleted,
    focusHabits,
    pattern: findTemporalPattern(current.opportunities),
    history
  };
}
