import type { ScheduledOpportunity } from './opportunities';

export type TemporalPatternSummary = {
  title: string;
  label: string;
  sample: string;
  detail: string;
  tone: 'progress' | 'attention' | 'neutral';
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function getWeekdayPattern(points: ScheduledOpportunity[]): TemporalPatternSummary | null {
  if (points.length < 28) {
    return null;
  }

  const totals = WEEKDAY_LABELS.map((label) => ({ label, scheduled: 0, completed: 0 }));
  points.forEach((point) => {
    const bucket = totals[point.weekday];
    bucket.scheduled += 1;
    bucket.completed += point.completed ? 1 : 0;
  });

  const eligible = totals
    .filter((bucket) => bucket.scheduled >= 4)
    .map((bucket) => ({ ...bucket, rate: bucket.completed / bucket.scheduled }))
    .sort((left, right) => right.rate - left.rate);
  const top = eligible[0];
  const bottom = eligible[eligible.length - 1];
  if (!top || !bottom) {
    return null;
  }

  const gap = Math.round((top.rate - bottom.rate) * 100);
  if (gap < 15) {
    return null;
  }

  return {
    title: 'Weekday pattern',
    label: `${bottom.label} runs ${gap} pp below ${top.label}`,
    sample: `${points.length} scheduled opportunities`,
    detail: `In this window, ${top.label} is the steadier day. This describes timing, not the reason behind it.`,
    tone: 'attention'
  };
}

function getMonthPhasePattern(points: ScheduledOpportunity[]): TemporalPatternSummary | null {
  if (new Set(points.map((point) => point.monthKey)).size < 3) {
    return null;
  }

  const buckets = {
    early: { label: 'Early month', scheduled: 0, completed: 0 },
    mid: { label: 'Middle month', scheduled: 0, completed: 0 },
    late: { label: 'Last 7 days', scheduled: 0, completed: 0 }
  };
  points.forEach((point) => {
    const bucket = buckets[point.monthPhase];
    bucket.scheduled += 1;
    bucket.completed += point.completed ? 1 : 0;
  });

  const eligible = Object.values(buckets)
    .filter((bucket) => bucket.scheduled >= 6)
    .map((bucket) => ({ ...bucket, rate: bucket.completed / bucket.scheduled }))
    .sort((left, right) => right.rate - left.rate);
  const top = eligible[0];
  const bottom = eligible[eligible.length - 1];
  if (!top || !bottom) {
    return null;
  }

  const gap = Math.round((top.rate - bottom.rate) * 100);
  if (gap < 12) {
    return null;
  }

  return {
    title: 'Month pattern',
    label: `${bottom.label} runs ${gap} pp below ${top.label}`,
    sample: `${new Set(points.map((point) => point.monthKey)).size} observed months`,
    detail: `${top.label} is steadier in this history. Treat the boundary as a cue to simplify the next step.`,
    tone: 'neutral'
  };
}

function getHabitSequences(points: ScheduledOpportunity[]): ScheduledOpportunity[][] {
  const byHabit = new Map<string, ScheduledOpportunity[]>();
  points.forEach((point) => {
    const sequence = byHabit.get(point.habitId) ?? [];
    sequence.push(point);
    byHabit.set(point.habitId, sequence);
  });
  return [...byHabit.values()].map((sequence) =>
    sequence.sort((left, right) => left.calendarDate.localeCompare(right.calendarDate))
  );
}

function getMissRuns(points: ScheduledOpportunity[]): { completed: boolean; length: number }[] {
  const runs: { completed: boolean; length: number }[] = [];
  getHabitSequences(points).forEach((sequence) => {
    let running = 0;
    sequence.forEach((point) => {
      if (!point.completed) {
        running += 1;
        return;
      }
      if (running >= 2) {
        runs.push({ completed: true, length: running });
      }
      running = 0;
    });
    if (running >= 2) {
      runs.push({ completed: false, length: running });
    }
  });
  return runs;
}

function getRecoveryPattern(points: ScheduledOpportunity[]): TemporalPatternSummary | null {
  const completedRuns = getMissRuns(points).filter((run) => run.completed);
  if (completedRuns.length < 3) {
    return null;
  }

  const ordered = completedRuns.map((run) => run.length).sort((left, right) => left - right);
  const median = ordered[Math.floor(ordered.length / 2)];
  return {
    title: 'Recovery pattern',
    label: `You usually return after ${median} missed opportunities`,
    sample: `${completedRuns.length} completed recoveries`,
    detail: 'Your history shows a return, not a failure. Restart with the smallest scheduled action.',
    tone: 'progress'
  };
}

function getLapsePattern(points: ScheduledOpportunity[]): TemporalPatternSummary | null {
  const runs = getMissRuns(points);
  if (runs.length < 2) {
    return null;
  }

  const longest = Math.max(...runs.map((run) => run.length));
  const average = runs.reduce((sum, run) => sum + run.length, 0) / runs.length;
  return {
    title: 'Lapse clusters',
    label: `Breaks average ${average.toFixed(1)} scheduled opportunities`,
    sample: `${runs.length} observed clusters`,
    detail: `The longest cluster is ${longest}. One small completion today can start the next recovery.`,
    tone: 'attention'
  };
}

export function findTemporalPattern(points: ScheduledOpportunity[]): TemporalPatternSummary | null {
  return getWeekdayPattern(points)
    ?? getMonthPhasePattern(points)
    ?? getRecoveryPattern(points)
    ?? getLapsePattern(points);
}
