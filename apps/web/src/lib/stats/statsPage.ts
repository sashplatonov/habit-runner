import type { Habit } from '@/types/habit';
import { PERIOD_DAY_RANGES, WEEKDAY_NA } from '$lib/constants/stats';
import { toCompletionKey } from '@/lib/completionKey';
import { formatAppDate } from '@/lib/i18n';
import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

export type PeriodOption = 'week' | 'month' | 'quarter' | 'year';

export type PeriodSegment = {
  start: Date;
  end: Date;
  label: string;
};

export type DailyDataPoint = {
  day: string;
  axisLabel: string;
  completed: number;
  total: number;
  rate: number;
};

export type HabitPeriodDataRow = {
  period: string;
} & Record<string, string | number>;

export type WeekdayStats = {
  bestWeekday: string;
  worstWeekday: string;
  bestIndex: number;
  worstIndex: number;
  counts: number[];
  investmentPercent: number;
  totalActiveDays: number;
  spanDays: number;
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function differenceInDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

export function getCompletionThreshold(habit: Habit): number {
  return Math.max(1, habit.dailyTarget ?? 1);
}

export function filterStatsHabits(
  habits: Habit[],
  statusFilter: 'all' | 'active' | 'archived',
  searchQuery: string,
  selectedTags: string[]
): Habit[] {
  return habits.filter((habit) => {
    if (statusFilter === 'active' && habit.archived) {
      return false;
    }
    if (statusFilter === 'archived' && !habit.archived) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!habit.name.toLowerCase().includes(query) && !(habit.description ?? '').toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedTags.length > 0 && !(habit.tags ?? []).some((tag) => selectedTags.includes(tag))) {
      return false;
    }
    return true;
  });
}

export function cleanupHiddenHabits(hiddenHabits: string[], filteredHabits: Habit[]): string[] {
  const allowed = new Set(filteredHabits.map((habit) => habit.name));
  const next = hiddenHabits.filter((name) => allowed.has(name));
  return next.length === hiddenHabits.length ? hiddenHabits : next;
}

export function getWindowRange(period: PeriodOption, referenceDate = new Date()) {
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const windowLength = PERIOD_DAY_RANGES[period] ?? 30;
  const start = new Date(end.getTime() - (windowLength - 1) * 86_400_000);
  return { start, end };
}

function formatSegmentLabel(date: Date, period: PeriodOption): string {
  switch (period) {
    case 'week':
      return formatAppDate(date, { weekday: 'short' });
    case 'month':
      return formatAppDate(date, { month: 'short', day: 'numeric' });
    case 'quarter':
      return formatAppDate(date, { month: 'short', day: 'numeric' });
    case 'year':
      return formatAppDate(date, { month: 'short', year: 'numeric' });
    default:
      return formatAppDate(date, { month: 'short', day: 'numeric' });
  }
}

function buildDailySegments(period: PeriodOption, days: number, referenceDate = new Date()): PeriodSegment[] {
  const segments: PeriodSegment[] = [];
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = new Date(today);
    start.setDate(start.getDate() - offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    segments.push({
      start,
      end,
      label: formatSegmentLabel(start, period)
    });
  }

  return segments;
}

function groupSegmentsByMonth(segments: PeriodSegment[]): PeriodSegment[] {
  if (segments.length === 0) {
    return segments;
  }

  const grouped: PeriodSegment[] = [];
  let cursor = 0;

  while (cursor < segments.length) {
    const current = segments[cursor];
    const month = current.start.getMonth();
    const year = current.start.getFullYear();
    let endIndex = cursor + 1;

    while (endIndex < segments.length) {
      const next = segments[endIndex].start;
      if (next.getMonth() !== month || next.getFullYear() !== year) {
        break;
      }
      endIndex += 1;
    }

    const chunk = segments.slice(cursor, endIndex);
    grouped.push({
      start: current.start,
      end: chunk[chunk.length - 1].end,
      label: formatAppDate(current.start, { month: 'short', year: 'numeric' })
    });
    cursor = endIndex;
  }

  return grouped;
}

function groupSegmentsByWeekByMonth(segments: PeriodSegment[]): PeriodSegment[] {
  if (segments.length === 0) {
    return segments;
  }

  const grouped: PeriodSegment[] = [];
  let cursor = 0;

  while (cursor < segments.length) {
    const current = segments[cursor];
    const month = current.start.getMonth();
    const year = current.start.getFullYear();
    const monthSegments: PeriodSegment[] = [];

    while (cursor < segments.length) {
      const next = segments[cursor];
      if (next.start.getMonth() !== month || next.start.getFullYear() !== year) {
        break;
      }
      monthSegments.push(next);
      cursor += 1;
    }

    const monthLabel = formatAppDate(monthSegments[0].start, { month: 'short', year: '2-digit' });
    let weekNumber = 1;

    for (let index = 0; index < monthSegments.length; index += 7) {
      const chunk = monthSegments.slice(index, index + 7);
      grouped.push({
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
        label: `${monthLabel} · Week ${weekNumber}`
      });
      weekNumber += 1;
    }
  }

  return grouped;
}

export function buildPeriodSegments(period: PeriodOption, referenceDate = new Date()): PeriodSegment[] {
  const dailySegments = buildDailySegments(period, PERIOD_DAY_RANGES[period] ?? 30, referenceDate);

  if (period === 'quarter') {
    return groupSegmentsByWeekByMonth(dailySegments);
  }
  if (period === 'year') {
    return groupSegmentsByMonth(dailySegments);
  }

  return dailySegments;
}

export function generateDailyCompletionData(
  habits: Habit[],
  start: Date,
  end: Date,
  period: PeriodOption,
  segments: PeriodSegment[]
): DailyDataPoint[] {
  if (period === 'week' || period === 'month') {
    const total = habits.length;
    const length = differenceInDays(end, start) + 1;

    return Array.from({ length }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toCompletionKey(date);
      const completed = habits.filter((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit)).length;

      return {
        day: formatAppDate(date, { month: 'short', day: 'numeric' }),
        axisLabel: period === 'week'
          ? formatAppDate(date, { weekday: 'short' })
          : formatAppDate(date, { month: 'short', day: 'numeric' }),
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }

  return segments.map((segment) => {
    const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
    let completed = 0;

    for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
      const key = toCompletionKey(cursor);
      completed += habits.filter((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit)).length;
    }

    const total = habits.length * spanDays;

    return {
      day: segment.label,
      axisLabel: segment.label,
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });
}

export function generateHabitPeriodData(habits: Habit[], segments: PeriodSegment[]): HabitPeriodDataRow[] {
  return segments.map((segment) => {
    const entry: HabitPeriodDataRow = { period: segment.label };
    const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));

    habits.forEach((habit) => {
      let completed = 0;
      for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
        const key = toCompletionKey(cursor);
        if ((habit.completions[key] ?? 0) >= getCompletionThreshold(habit)) {
          completed += 1;
        }
      }
      entry[habit.name] = Math.round((completed / spanDays) * 100);
    });

    return entry;
  });
}

export function buildWeekdayStats(habits: Habit[], start: Date, end: Date): WeekdayStats {
  const counts = Array(7).fill(0);
  const activeDays = new Set<string>();
  const spanDays = differenceInDays(end, start) + 1;

  for (let offset = 0; offset < spanDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = toCompletionKey(date);
    const isCompleted = habits.some((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit));

    if (isCompleted) {
      counts[date.getDay()] += 1;
      activeDays.add(key);
    }
  }

  let bestIndex = 0;
  let worstIndex = -1;

  for (let index = 0; index < 7; index += 1) {
    if (counts[index] > counts[bestIndex]) {
      bestIndex = index;
    }
    if (counts[index] > 0 && (worstIndex === -1 || counts[index] < counts[worstIndex])) {
      worstIndex = index;
    }
  }

  const totalActiveDays = activeDays.size;
  const investmentPercent = Math.round((totalActiveDays / Math.max(1, spanDays)) * 100);
  const resolvedWorstIndex = worstIndex >= 0 ? worstIndex : bestIndex;

  return {
    bestWeekday: counts[bestIndex] > 0 ? WEEKDAY_NAMES[bestIndex] : WEEKDAY_NA,
    worstWeekday: worstIndex >= 0 ? WEEKDAY_NAMES[worstIndex] : WEEKDAY_NA,
    bestIndex,
    worstIndex: resolvedWorstIndex,
    counts,
    investmentPercent,
    totalActiveDays,
    spanDays
  };
}

export function buildMergedCompletions(habits: Habit[]): Record<string, number> {
  const merged: Record<string, number> = {};

  habits.forEach((habit) => {
    Object.entries(habit.completions).forEach(([date, count]) => {
      merged[date] = (merged[date] ?? 0) + (count ?? 0);
    });
  });

  return merged;
}

export function buildDayDetails(habits: Habit[]): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  habits.forEach((habit) => {
    const label = formatHabitLabel(habit);
    const threshold = getCompletionThreshold(habit);

    Object.entries(habit.completions).forEach(([date, count]) => {
      if ((count ?? 0) < threshold) {
        return;
      }
      if (!details[date]) {
        details[date] = [];
      }
      details[date].push(label);
    });
  });

  return details;
}
