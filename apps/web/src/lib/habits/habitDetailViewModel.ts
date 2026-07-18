import {
  describeSchedule,
  formatCalendarDateInTimeZone
} from '@habbit-runner/shared';
import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday, resolveHabitSchedule } from '$lib/habits/schedule';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';
import type { Habit, HabitStats } from '@/types/habit';

export type HabitDetailLoadState = 'loading' | 'not-found' | 'ready';
export type HabitDetailOperationalState = 'not-scheduled' | 'in-progress' | 'complete' | 'frozen' | 'archived' | 'pending' | 'error';

export type HabitDetailViewModel = {
  loadState: HabitDetailLoadState;
  operationalState: HabitDetailOperationalState;
  habitLabel: string;
  descriptionLabel: string;
  todayLabel: string;
  todaySummary: string;
  progressLabel: string;
  remainingLabel: string;
  scheduleSummary: string;
  reminderSummary: string;
  nextMilestoneLabel: string;
  nextMilestoneDays: number | null;
  nextMilestoneTarget: number | null;
  currentStreak: number;
  hasCompletionHistory: boolean;
  streakLabel: string;
  bestLabel: string;
  completionRateLabel: string;
  recoveryCopy: string;
  isScheduledToday: boolean;
  isMandatoryToday: boolean;
  isFrozenToday: boolean;
  isArchived: boolean;
  isPending: boolean;
  hasError: boolean;
};

function describeReminder(habit: Habit): string {
  if (!habit.reminderEnabled) {
    return 'Reminders are off';
  }

  return habit.reminderTime ? `Daily at ${habit.reminderTime}` : 'No reminder set';
}

const MOMENTUM_MILESTONES = [1, 3, 7, 14, 21, 30, 45, 66, 100] as const;

function buildMilestone(currentStreak: number): { label: string; days: number | null; target: number | null } {
  const next = MOMENTUM_MILESTONES.find((milestone) => milestone > currentStreak) ?? null;
  return next === null
    ? { label: '100-day rhythm reached', days: null, target: null }
    : {
        label: next === 1 ? 'First scheduled completion' : `${next}-day checkpoint`,
        days: next - currentStreak,
        target: next
      };
}

function resolveDetailState(input: {
  habit: Habit;
  completedToday: boolean;
  mandatoryToday: boolean;
  frozenToday: boolean;
  pending: boolean;
  error: boolean;
}): HabitDetailOperationalState {
  if (input.error) {
    return 'error';
  }

  if (input.pending) {
    return 'pending';
  }

  if (input.habit.archived) {
    return 'archived';
  }

  if (input.frozenToday) {
    return 'frozen';
  }

  if (!input.mandatoryToday) {
    return 'not-scheduled';
  }

  if (input.completedToday) {
    return 'complete';
  }

  return 'in-progress';
}

function buildRecoveryCopy(state: HabitDetailOperationalState): string {
  if (state === 'complete') {
    return 'Today is already complete. Keep the routine stable.';
  }

  if (state === 'frozen') {
    return 'Today is frozen. Resume when the freeze ends.';
  }

  if (state === 'archived') {
    return 'Archived habits stay visible for history and can be restored.';
  }

  if (state === 'not-scheduled') {
    return 'Not scheduled today. Use the next scheduled opportunity.';
  }

  if (state === 'error') {
    return 'The latest change needs another try.';
  }

  return 'Use today’s step to make the next repetition easy.';
}

function buildProgressLabel(habit: Habit, todayCount: number, target: number): { count: number; remaining: number } {
  if (habit.type === 'negative') {
    return { count: Math.max(0, target - todayCount), remaining: Math.max(0, todayCount) };
  }

  return { count: Math.min(todayCount, target), remaining: Math.max(0, target - todayCount) };
}

function buildEmptyHabitDetailViewModel(): HabitDetailViewModel {
  return {
    loadState: 'not-found',
    operationalState: 'pending',
    habitLabel: '',
    descriptionLabel: '',
    todayLabel: 'Today',
    todaySummary: '',
    progressLabel: '',
    remainingLabel: '',
    scheduleSummary: '',
    reminderSummary: '',
    nextMilestoneLabel: '',
    nextMilestoneDays: null,
    nextMilestoneTarget: null,
    currentStreak: 0,
    hasCompletionHistory: false,
    streakLabel: '',
    bestLabel: '',
    completionRateLabel: '',
    recoveryCopy: '',
    isScheduledToday: false,
    isMandatoryToday: false,
    isFrozenToday: false,
    isArchived: false,
    isPending: false,
    hasError: false
  };
}

function buildDetailSnapshot(
  habit: Habit,
  stats: HabitStats,
  referenceDate: Date,
  timeZone: string,
  options: { pending?: boolean; error?: boolean }
) {
  const habitLabel = formatHabitLabel(habit);
  const todayKey = formatCalendarDateInTimeZone(referenceDate, timeZone);
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const todayCount = Math.max(0, Math.trunc(habit.completions[`${todayKey}T00:00:00Z`] ?? 0));
  const completedToday = habit.type === 'negative' ? todayCount === 0 : todayCount >= target;
  const frozenToday = habit.freezeDays?.includes(todayKey) ?? false;
  const mandatoryToday = isMandatoryToday(habit, referenceDate, timeZone);
  const scheduledToday = getScheduleStatusForDate(habit, referenceDate, timeZone) !== 'unscheduled';
  const currentStreak = calculateScheduledStreak(habit, habit.completions, referenceDate, timeZone).current;
  const bestStreak = stats.longestStreak;
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, referenceDate, timeZone);
  const nextMilestone = buildMilestone(currentStreak);
  const progress = buildProgressLabel(habit, todayCount, target);
  const state = resolveDetailState({
    habit,
    completedToday,
    mandatoryToday,
    frozenToday,
    pending: options.pending ?? false,
    error: options.error ?? false
  });

  return {
    habitLabel,
    target,
    progress,
    state,
    completedToday,
    mandatoryToday,
    frozenToday,
    scheduledToday,
    currentStreak,
    bestStreak,
    completionRate,
    nextMilestone,
    todayKey
  };
}

function buildTodayLabel(mandatoryToday: boolean): string {
  return mandatoryToday ? 'Today' : 'Not scheduled today';
}

function buildTodaySummary(mandatoryToday: boolean, progress: { count: number }, target: number): string {
  return mandatoryToday ? `${progress.count}/${target} completed today` : 'No completion is required today';
}

function buildRemainingLabel(progress: { remaining: number }): string {
  return progress.remaining === 0 ? 'Goal reached' : `${progress.remaining} remaining`;
}

export function buildHabitDetailViewModel(
  habit: Habit | null,
  stats: HabitStats | null,
  referenceDate = new Date(),
  timeZone = getCurrentUserTimeZone(),
  options: { pending?: boolean; error?: boolean } = {}
): HabitDetailViewModel {
  if (!habit || !stats) {
    return habit ? { ...buildEmptyHabitDetailViewModel(), loadState: 'loading' } : buildEmptyHabitDetailViewModel();
  }
  const detail = buildDetailSnapshot(habit, stats, referenceDate, timeZone, options);

  return {
    loadState: 'ready',
    operationalState: detail.state,
    habitLabel: detail.habitLabel,
    descriptionLabel: habit.description ? `Open description for ${detail.habitLabel}` : '',
    todayLabel: buildTodayLabel(detail.mandatoryToday),
    todaySummary: buildTodaySummary(detail.mandatoryToday, detail.progress, detail.target),
    progressLabel: `${detail.progress.count}/${detail.target}`,
    remainingLabel: buildRemainingLabel(detail.progress),
    scheduleSummary: describeSchedule(resolveHabitSchedule(habit)),
    reminderSummary: describeReminder(habit),
    nextMilestoneLabel: detail.nextMilestone.label,
    nextMilestoneDays: detail.nextMilestone.days,
    nextMilestoneTarget: detail.nextMilestone.target,
    currentStreak: detail.currentStreak,
    hasCompletionHistory: stats.completedDays > 0,
    streakLabel: `${detail.currentStreak} day${detail.currentStreak === 1 ? '' : 's'}`,
    bestLabel: `${detail.bestStreak} day${detail.bestStreak === 1 ? '' : 's'} best`,
    completionRateLabel: `${detail.completionRate}% completion`,
    recoveryCopy: buildRecoveryCopy(detail.state),
    isScheduledToday: detail.scheduledToday,
    isMandatoryToday: detail.mandatoryToday,
    isFrozenToday: detail.frozenToday,
    isArchived: habit.archived,
    isPending: options.pending ?? false,
    hasError: options.error ?? false
  };
}
