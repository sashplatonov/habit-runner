export type TodaySummaryState =
  | 'hydrating'
  | 'nothing-scheduled'
  | 'ready'
  | 'in-progress'
  | 'one-left'
  | 'complete'
  | 'comeback';

export type TodaySummaryMetric = {
  label: string;
  value: string;
  tone?: 'muted' | 'accent' | 'progress' | 'attention';
};

export type TodaySummaryModel = {
  state: TodaySummaryState;
  title: string;
  headline: string;
  message: string;
  progressLabel: string;
  progressValue: number;
  progressTone: 'progress' | 'attention' | 'neutral';
  nextActionLabel: string | null;
  nextHabitId: string | null;
  metrics: TodaySummaryMetric[];
  isComplete: boolean;
};

export type BuildTodaySummaryInput = {
  isHydrating: boolean;
  scheduledCount: number;
  completedCount: number;
  bestStreak: number;
  daysSinceLastCompletion: number;
  nextHabitName?: string | null;
  nextHabitId?: string | null;
};

function makeSummary(partial: Omit<TodaySummaryModel, 'title'>): TodaySummaryModel {
  return {
    title: 'Today',
    ...partial
  };
}

function clampProgress(completedCount: number, scheduledCount: number): number {
  if (scheduledCount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((completedCount / scheduledCount) * 100)));
}

function formatStreak(value: number): string {
  const normalizedValue = Math.max(0, Math.trunc(value));
  return normalizedValue > 0 ? `${normalizedValue}d` : '—';
}

function createSupportingMetrics(scheduledCount: number, bestStreak: number): TodaySummaryMetric[] {
  return [
    { label: 'Scheduled', value: `${scheduledCount}`, tone: 'muted' },
    { label: 'Best streak', value: formatStreak(bestStreak), tone: 'progress' }
  ];
}

function formatProgressLabel(completedCount: number, scheduledCount: number): string {
  return `${completedCount} of ${scheduledCount} completed`;
}

function createNothingScheduledSummary(bestStreak: number): TodaySummaryModel {
  return makeSummary({
    state: 'nothing-scheduled',
    headline: 'Nothing is scheduled today',
    message: 'Nothing is planned today, so you can use the open space to plan, edit, or simply reset.',
    progressLabel: 'No habits scheduled',
    progressValue: 0,
    progressTone: 'neutral',
    nextActionLabel: null,
    nextHabitId: null,
    metrics: createSupportingMetrics(0, bestStreak),
    isComplete: false
  });
}

function createCompleteSummary(completedCount: number, scheduledCount: number, bestStreak: number): TodaySummaryModel {
  return makeSummary({
    state: 'complete',
    headline: 'Today is complete',
    message: 'Every scheduled habit is done. Keep the momentum steady.',
    progressLabel: formatProgressLabel(completedCount, scheduledCount),
    progressValue: 100,
    progressTone: 'progress',
    nextActionLabel: null,
    nextHabitId: null,
    metrics: createSupportingMetrics(scheduledCount, bestStreak),
    isComplete: true
  });
}

function createOneLeftSummary(
  context: {
    nextHabitName: string | null;
    nextHabitId: string | null;
    progressValue: number;
    completedCount: number;
    scheduledCount: number;
    bestStreak: number;
  }
): TodaySummaryModel {
  const { nextHabitName, nextHabitId, progressValue, completedCount, scheduledCount, bestStreak } = context;
  return makeSummary({
    state: 'one-left',
    headline: 'One more habit closes the day',
    message: nextHabitName
      ? `Finish ${nextHabitName} and you are done for today.`
      : 'One more scheduled habit remains before you are done.',
    progressLabel: formatProgressLabel(completedCount, scheduledCount),
    progressValue,
    progressTone: 'attention',
    nextActionLabel: nextHabitName ? `Continue with ${nextHabitName}` : null,
    nextHabitId,
    metrics: createSupportingMetrics(scheduledCount, bestStreak),
    isComplete: false
  });
}

function createComebackSummary(
  context: {
    nextHabitName: string | null;
    nextHabitId: string | null;
    progressValue: number;
    completedCount: number;
    scheduledCount: number;
    bestStreak: number;
  }
): TodaySummaryModel {
  const {
    nextHabitName,
    nextHabitId,
    progressValue,
    completedCount,
    scheduledCount,
    bestStreak
  } = context;
  return makeSummary({
    state: 'comeback',
    headline: 'Fresh start, same plan',
    message: nextHabitName
      ? `Pick ${nextHabitName} first and rebuild momentum with one clean win.`
      : 'Pick one scheduled habit and restart with a clean, neutral slate.',
    progressLabel: formatProgressLabel(completedCount, scheduledCount),
    progressValue,
    progressTone: 'attention',
    nextActionLabel: nextHabitName ? `Start with ${nextHabitName}` : null,
    nextHabitId,
    metrics: createSupportingMetrics(scheduledCount, bestStreak),
    isComplete: false
  });
}

function createActiveSummary(
  context: {
    hasProgress: boolean;
    nextHabitName: string | null;
    nextHabitId: string | null;
    progressValue: number;
    completedCount: number;
    scheduledCount: number;
    bestStreak: number;
  }
): TodaySummaryModel {
  const { hasProgress, nextHabitName, nextHabitId, progressValue, completedCount, scheduledCount, bestStreak } = context;
  return makeSummary({
    state: hasProgress ? 'in-progress' : 'ready',
    headline: hasProgress ? 'You are moving through today' : 'One clear target is waiting',
    message: nextHabitName
      ? hasProgress
        ? `Keep going with ${nextHabitName}.`
        : `Start with ${nextHabitName}.`
      : hasProgress
        ? 'Keep the current rhythm and finish the remaining scheduled work.'
        : 'Open the first scheduled habit and make the day feel real.',
    progressLabel: formatProgressLabel(completedCount, scheduledCount),
    progressValue,
    progressTone: hasProgress ? 'progress' : 'neutral',
    nextActionLabel: nextHabitName
      ? hasProgress
        ? `Continue with ${nextHabitName}`
        : `Start with ${nextHabitName}`
      : null,
    nextHabitId,
    metrics: createSupportingMetrics(scheduledCount, bestStreak),
    isComplete: false
  });
}

export function buildTodaySummary(input: BuildTodaySummaryInput): TodaySummaryModel {
  if (input.isHydrating) {
    return makeSummary({
      state: 'hydrating',
      headline: 'Loading today',
      message: 'Syncing schedule, check-ins, and streaks.',
      progressLabel: 'Today progress',
      progressValue: 0,
      progressTone: 'neutral',
      nextActionLabel: null,
      nextHabitId: null,
      metrics: [],
      isComplete: false
    });
  }

  const scheduledCount = Math.max(0, Math.trunc(input.scheduledCount));
  const completedCount = Math.min(scheduledCount, Math.max(0, Math.trunc(input.completedCount)));
  const daysSinceLastCompletion = Math.max(0, Math.trunc(input.daysSinceLastCompletion));
  const progressValue = clampProgress(completedCount, scheduledCount);
  const nextHabitName = input.nextHabitName?.trim() || null;
  const nextHabitId = input.nextHabitId ?? null;
  const hasSchedule = scheduledCount > 0;
  const hasProgress = completedCount > 0;
  const isComplete = hasSchedule && completedCount >= scheduledCount;

  if (!hasSchedule) {
    return createNothingScheduledSummary(input.bestStreak);
  }

  if (isComplete) {
    return createCompleteSummary(completedCount, scheduledCount, input.bestStreak);
  }

  if (scheduledCount - completedCount === 1) {
    return createOneLeftSummary({
      nextHabitName,
      nextHabitId,
      progressValue,
      completedCount,
      scheduledCount,
      bestStreak: input.bestStreak
    });
  }

  if (daysSinceLastCompletion >= 2) {
    return createComebackSummary({
      nextHabitName,
      nextHabitId,
      progressValue,
      completedCount,
      scheduledCount,
      bestStreak: input.bestStreak
    });
  }

  return createActiveSummary({
    hasProgress,
    nextHabitName,
    nextHabitId,
    progressValue,
    completedCount,
    scheduledCount,
    bestStreak: input.bestStreak
  });
}
