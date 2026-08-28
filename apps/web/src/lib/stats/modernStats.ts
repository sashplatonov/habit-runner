import { addDaysToCalendarDate, calendarDateToDate, getWeekdayFromCalendarDate } from '@habbit-runner/shared';
import type { Habit } from '@/types/habit';
import { formatAppDate } from '@/lib/i18n';
import { calculateScheduledStreak } from '$lib/habits/schedule';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';
import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
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

export type HabitHeatmapState = 'completed' | 'missed' | 'not scheduled';

export type HabitHeatmapCell = {
  calendarDate: string;
  state: HabitHeatmapState;
  intensity: number;
};

export type HabitAnalyticsModel = {
  id: string;
  habit: Habit;
  label: string;
  completionRate: number | null;
  completed: number;
  scheduled: number;
  delta: number | null;
  trend: number[];
  heatmap: HabitHeatmapCell[];
  insight: string;
  reason: string;
  currentStreak: number;
  longestStreak: number;
};

export type HistoryDay = AggregateDayPoint & {
  completionRate: number | null;
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
  summary: {
    completionRate: number | null;
    completed: number;
    scheduled: number;
    delta: number | null;
  };
  needsAttention: HabitAnalyticsModel[];
  strong: HabitAnalyticsModel[];
  habitModels: HabitAnalyticsModel[];
  historyDays: HistoryDay[];
  currentWeek: HistoryDay[];
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

function rateFor(points: ScheduledOpportunity[]): number | null {
  return getRate(points.filter((point) => point.completed).length, points.length);
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

function buildHistoryDays(points: AggregateDayPoint[]): HistoryDay[] {
  return points.map((point) => ({
    ...point,
    completionRate: getRate(point.completedDays, point.scheduledDays)
  }));
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

  const currentRate = rateFor(current);
  const previousRate = rateFor(previous);
  if (currentRate === null || previousRate === null) {
    return { trendDelta: null, trendLabel: 'insufficient-data', trendSample };
  }
  const trendDelta = currentRate - previousRate;
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
  const previousRate = rateFor(previous.opportunities);
  const streak = calculateScheduledStreak(habit, habit.completions, referenceDate, timeZone);

  return {
    id: habit.id,
    habit,
    completionRate: completionRate ?? 0,
    completionDelta: completionRate === null || previousRate === null ? null : completionRate - previousRate,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    milestone: MILESTONES.find((milestone) => milestone > streak.current) ?? null
  };
}

function getTrailingMisses(points: ScheduledOpportunity[]): number {
  let misses = 0;
  for (const point of [...points].sort((left, right) => right.calendarDate.localeCompare(left.calendarDate))) {
    if (point.completed) {
      break;
    }
    misses += 1;
  }
  return misses;
}

function getRecovery(points: ScheduledOpportunity[]): boolean {
  let misses = 0;
  return [...points]
    .sort((left, right) => left.calendarDate.localeCompare(right.calendarDate))
    .some((point) => {
      if (!point.completed) {
        misses += 1;
        return false;
      }
      const recovered = misses >= 2;
      misses = 0;
      return recovered;
    });
}

type HabitSignal = 'attention' | 'strong' | 'neutral';

function hasAttentionSignal(completionRate: number | null, previousRate: number | null, delta: number | null, trailingMisses: number): boolean {
  const lowRate = completionRate !== null && completionRate < 60;
  const negativeDelta = delta !== null && delta < 0;
  const weak = completionRate !== null && completionRate < 75 && previousRate !== null && previousRate < 75;
  return lowRate || negativeDelta || trailingMisses >= 2 || weak;
}

function hasStrongSignal(completionRate: number | null, delta: number | null, recovery: boolean): boolean {
  const highRate = completionRate !== null && completionRate >= 80;
  const positiveDelta = delta !== null && delta > 0;
  return highRate || positiveDelta || recovery;
}

function getHabitSignal({
  scheduled,
  completionRate,
  previousRate,
  delta,
  trailingMisses,
  recovery
}: {
  scheduled: number;
  completionRate: number | null;
  previousRate: number | null;
  delta: number | null;
  trailingMisses: number;
  recovery: boolean;
}): HabitSignal {
  if (scheduled > 0 && hasAttentionSignal(completionRate, previousRate, delta, trailingMisses)) {
    return 'attention';
  }
  if (scheduled > 0 && hasStrongSignal(completionRate, delta, recovery)) {
    return 'strong';
  }
  return 'neutral';
}

function getSignalCopy(
  signal: HabitSignal,
  completionRate: number | null,
  delta: number | null,
  trailingMisses: number,
  recovery: boolean
): { insight: string; reason: string } {
  const lowRate = completionRate !== null && completionRate < 60;
  if (signal === 'attention') {
    if (lowRate) { return { insight: 'Completion is running low', reason: 'Low completion rate' }; }
    if (trailingMisses >= 2) { return { insight: 'A recent run of misses needs attention', reason: 'Consecutive missed opportunities' }; }
    if (delta !== null && delta < 0) { return { insight: 'Completion is below the previous period', reason: 'Negative change from the previous period' }; }
    return { insight: 'Completion is below the previous period', reason: 'Persisting low completion' };
  }
  if (signal === 'strong') {
    if (recovery) { return { insight: 'Recovered after missed opportunities', reason: 'Recovery after a missed run' }; }
    if (completionRate !== null && completionRate >= 80) { return { insight: 'A consistently strong rhythm', reason: 'High completion rate' }; }
    return { insight: 'Improving against the previous period', reason: 'Positive change from the previous period' };
  }
  return { insight: 'No clear signal yet', reason: 'Not enough evidence for a section' };
}

function buildHabitTrend(
  dates: string[],
  opportunitiesByDate: Map<string, ScheduledOpportunity>
): number[] {
  const observations = dates.flatMap((calendarDate, index) => {
    const opportunity = opportunitiesByDate.get(calendarDate);
    return opportunity ? [{ x: index, y: opportunity.completed ? 1 : 0 }] : [];
  });
  if (observations.length < 2 || dates.length < 2) {
    return [];
  }

  const meanX = observations.reduce((sum, observation) => sum + observation.x, 0) / observations.length;
  const meanY = observations.reduce((sum, observation) => sum + observation.y, 0) / observations.length;
  const variance = observations.reduce((sum, observation) => sum + (observation.x - meanX) ** 2, 0);
  const covariance = observations.reduce(
    (sum, observation) => sum + (observation.x - meanX) * (observation.y - meanY),
    0
  );
  const slope = variance === 0 ? 0 : covariance / variance;
  const intercept = meanY - slope * meanX;
  const sampleCount = Math.min(5, dates.length);

  return Array.from({ length: sampleCount }, (_, index) => {
    const x = (dates.length - 1) * (index / Math.max(1, sampleCount - 1));
    return Math.max(0, Math.min(1, intercept + slope * x));
  });
}

function buildHabitHeatmap(
  dates: string[],
  opportunitiesByDate: Map<string, ScheduledOpportunity>
): HabitHeatmapCell[] {
  return dates.map((calendarDate, index) => {
    const opportunity = opportunitiesByDate.get(calendarDate);
    if (!opportunity) {
      return { calendarDate, state: 'not scheduled', intensity: 0.15 };
    }

    const nearby = dates
      .slice(Math.max(0, index - 3), Math.min(dates.length, index + 4))
      .flatMap((date) => {
        const point = opportunitiesByDate.get(date);
        return point ? [point] : [];
      });
    const matchingSignals = nearby.filter((point) => point.completed === opportunity.completed).length;
    const localStrength = nearby.length > 0 ? matchingSignals / nearby.length : 0;

    return {
      calendarDate,
      state: opportunity.completed ? 'completed' : 'missed',
      intensity: opportunity.completed
        ? 0.5 + localStrength * 0.5
        : 0.45 + localStrength * 0.45
    };
  });
}

function buildHabitAnalytics(
  habit: Habit,
  window: StatsWindowId,
  referenceDate: Date,
  timeZone: string
): HabitAnalyticsModel {
  const { current, previous } = buildStatsWindows([habit], window, referenceDate, timeZone);
  const currentPoints = current.opportunities;
  const previousPoints = previous.opportunities;
  const completed = currentPoints.filter((point) => point.completed).length;
  const scheduled = currentPoints.length;
  const completionRate = getRate(completed, scheduled);
  const previousRate = getRate(
    previousPoints.filter((point) => point.completed).length,
    previousPoints.length
  );
  const delta = completionRate === null || previousRate === null ? null : completionRate - previousRate;
  const streak = calculateScheduledStreak(habit, habit.completions, referenceDate, timeZone);
  const byDate = new Map(currentPoints.map((point) => [point.calendarDate, point]));
  const dates = current.days.map((day) => day.calendarDate);
  const trend = buildHabitTrend(dates, byDate);
  const heatmap = buildHabitHeatmap(dates, byDate);
  const trailingMisses = getTrailingMisses(currentPoints);
  const recovery = getRecovery(currentPoints);
  const signal = getHabitSignal({ scheduled, completionRate, previousRate, delta, trailingMisses, recovery });
  const { insight, reason } = getSignalCopy(signal, completionRate, delta, trailingMisses, recovery);

  return {
    id: habit.id,
    habit,
    label: formatHabitLabel(habit),
    completionRate,
    completed,
    scheduled,
    delta,
    trend,
    heatmap,
    insight,
    reason,
    currentStreak: streak.current,
    longestStreak: streak.longest
  };
}

function sortAnalytics(left: HabitAnalyticsModel, right: HabitAnalyticsModel, direction: 'asc' | 'desc'): number {
  const rateDifference = (left.completionRate ?? -1) - (right.completionRate ?? -1);
  if (rateDifference !== 0) {
    return direction === 'asc' ? rateDifference : -rateDifference;
  }
  const deltaDifference = (left.delta ?? -Infinity) - (right.delta ?? -Infinity);
  if (deltaDifference !== 0) {
    return direction === 'asc' ? deltaDifference : -deltaDifference;
  }
  const nameDifference = left.label.localeCompare(right.label, undefined, { sensitivity: 'base' });
  return nameDifference !== 0 ? nameDifference : left.id.localeCompare(right.id);
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

  add([...summaries].sort((left, right) => (right.completionRate ?? -1) - (left.completionRate ?? -1))[0], 'strong', 'Strong rhythm');
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
      .sort((left, right) => (left.completionRate ?? -1) - (right.completionRate ?? -1))[0],
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
  const { current: historyWindow } = buildStatsWindows(activeHabits, '12w', referenceDate, timeZone);
  const history = buildHistory(historyWindow.days);
  const historyDays = buildHistoryDays(historyWindow.days);
  const latestHistoryDay = historyDays.at(-1);
  const weekStart = latestHistoryDay
    ? addDaysToCalendarDate(latestHistoryDay.calendarDate, -((getWeekdayFromCalendarDate(latestHistoryDay.calendarDate) + 6) % 7))
    : null;
  const currentWeek = weekStart ? historyDays.filter((day) => day.calendarDate >= weekStart) : [];
  const totalScheduled = current.opportunities.length;
  const totalCompleted = current.opportunities.filter((point) => point.completed).length;
  const completionRate = getRate(totalCompleted, totalScheduled);
  const previousCompleted = previous.opportunities.filter((point) => point.completed).length;
  const previousRate = getRate(previousCompleted, previous.opportunities.length);
  const delta = completionRate === null || previousRate === null ? null : completionRate - previousRate;
  const analytics = activeHabits.map((habit) => buildHabitAnalytics(habit, window, referenceDate, timeZone));
  const needsAttention = analytics.filter((habit) => habit.reason !== 'Not enough evidence for a section' && (
    habit.insight === 'Completion is running low' || habit.insight === 'A recent run of misses needs attention' || habit.insight === 'Completion is below the previous period'
  )).sort((left, right) => sortAnalytics(left, right, 'asc'));
  const strong = analytics.filter((habit) => !needsAttention.some((candidate) => candidate.id === habit.id) && habit.reason !== 'Not enough evidence for a section')
    .sort((left, right) => sortAnalytics(left, right, 'desc'));
  const focusHabits = selectFocusHabits(activeHabits, window, referenceDate, timeZone);
  const strongestStreak = Math.max(0, ...focusHabits.map((habit) => habit.currentStreak));

  return {
    window,
    windowLabel: window === '1w' ? 'This week' : window === '4w' ? 'Last 4 weeks' : 'Last 12 weeks',
    momentum: getMomentum(current.opportunities),
    weeklyProgress: getWeeklyProgress(current.days),
    ...getTrend(current.opportunities, previous.opportunities),
    nextMilestone: MILESTONES.find((milestone) => milestone > strongestStreak) ?? null,
    comebackLabel: getComebackLabel(current.opportunities, totalCompleted, totalScheduled),
    totalScheduled,
    totalCompleted,
    focusHabits,
    summary: { completionRate, completed: totalCompleted, scheduled: totalScheduled, delta },
    needsAttention,
    strong,
    habitModels: analytics,
    historyDays,
    currentWeek,
    pattern: findTemporalPattern(current.opportunities),
    history
  };
}
