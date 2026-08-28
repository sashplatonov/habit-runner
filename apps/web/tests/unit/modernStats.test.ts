import { afterEach, describe, expect, it } from 'vitest';
import type { Habit } from '../../src/types/habit.js';
import { calendarDateToCompletionKey } from '../../src/lib/completionKey.js';
import { buildModernStatsSnapshot } from '../../src/lib/stats/modernStats.js';
import { setCurrentUserTimeZone } from '../../src/lib/time/userTimezone.js';

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Reading',
    description: '',
    color: 'blue',
    icon: '📚',
    tags: [],
    frequency: 'daily',
    schedule: { type: 'daily' },
    targetStreak: 21,
    dailyTarget: 1,
    completions: {},
    freezeDays: [],
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T09:00:00.000Z',
    version: 1,
    archived: false,
    sortOrder: 0,
    type: 'positive',
    reminderEnabled: true,
    ...overrides
  };
}

function buildFridayDipCompletions(referenceDate: Date): Record<string, number> {
  const completions: Record<string, number> = {};
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - 83);

  for (let offset = 0; offset < 84; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const day = date.getDay();
    const calendarDate = date.toISOString().slice(0, 10);

    if (day === 5) {
      continue;
    }

    completions[calendarDateToCompletionKey(calendarDate)] = 1;
  }

  const streakSeed = new Date(referenceDate);
  streakSeed.setDate(streakSeed.getDate() - 4);
  for (let offset = 0; offset < 5; offset += 1) {
    const date = new Date(streakSeed);
    date.setDate(streakSeed.getDate() + offset);
    completions[calendarDateToCompletionKey(date.toISOString().slice(0, 10))] = 1;
  }

  const breakDate = new Date(referenceDate);
  breakDate.setDate(breakDate.getDate() - 5);
  delete completions[calendarDateToCompletionKey(breakDate.toISOString().slice(0, 10))];

  return completions;
}

afterEach(() => {
  setCurrentUserTimeZone('UTC');
});

describe('buildModernStatsSnapshot', () => {
  it('builds a simple motivating stats snapshot from existing completions', () => {
    setCurrentUserTimeZone('UTC');
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const habit = createHabit({
      completions: buildFridayDipCompletions(referenceDate)
    });

    const snapshot = buildModernStatsSnapshot([habit], '12w', referenceDate);

    expect(snapshot.windowLabel).toBe('Last 12 weeks');
    expect(snapshot.history.length).toBe(12);
    expect(snapshot.focusHabits).toHaveLength(1);
    expect(snapshot.focusHabits[0]?.currentStreak).toBe(5);
    expect(snapshot.nextMilestone).toBe(7);
    expect(snapshot.pattern?.title).toBe('Weekday pattern');
  });

  it('counts the current calendar week instead of a rolling seven-day bucket', () => {
    const referenceDate = new Date('2026-07-15T12:00:00.000Z');
    const habit = createHabit({
      createdAt: '2026-06-01T09:00:00.000Z',
      completions: {
        [calendarDateToCompletionKey('2026-07-13')]: 1,
        [calendarDateToCompletionKey('2026-07-14')]: 1,
        [calendarDateToCompletionKey('2026-07-15')]: 1
      }
    });

    const snapshot = buildModernStatsSnapshot([habit], '4w', referenceDate, 'UTC');

    expect(snapshot.weeklyProgress).toBe(100);
  });

  it('excludes dates before creation and frozen dates from every denominator', () => {
    const habit = createHabit({
      createdAt: '2026-07-13T09:00:00.000Z',
      freezeDays: ['2026-07-14'],
      completions: {
        [calendarDateToCompletionKey('2026-07-13')]: 1,
        [calendarDateToCompletionKey('2026-07-15')]: 1
      }
    });

    const snapshot = buildModernStatsSnapshot(
      [habit],
      '4w',
      new Date('2026-07-15T12:00:00.000Z'),
      'UTC'
    );

    expect(snapshot.totalScheduled).toBe(2);
    expect(snapshot.totalCompleted).toBe(2);
    expect(snapshot.trendLabel).toBe('insufficient-data');
    expect(snapshot.trendDelta).toBeNull();
  });

  it('uses the supplied user timezone for calendar boundaries', () => {
    const habit = createHabit({
      createdAt: '2026-07-15T06:30:00.000Z',
      completions: {
        [calendarDateToCompletionKey('2026-07-14')]: 1
      }
    });

    const snapshot = buildModernStatsSnapshot(
      [habit],
      '4w',
      new Date('2026-07-15T06:45:00.000Z'),
      'America/Los_Angeles'
    );

    expect(snapshot.totalScheduled).toBe(1);
    expect(snapshot.totalCompleted).toBe(1);
  });

  it('selects distinct strong, growing, and support focus habits', () => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const dates = Array.from({ length: 28 }, (_, index) => {
      const date = new Date('2026-06-19T12:00:00.000Z');
      date.setUTCDate(date.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const strong = createHabit({
      id: 'strong',
      completions: Object.fromEntries(dates.map((date) => [calendarDateToCompletionKey(date), 1]))
    });
    const growing = createHabit({
      id: 'growing',
      name: 'Growing',
      completions: Object.fromEntries(dates.slice(-14).map((date) => [calendarDateToCompletionKey(date), 1]))
    });
    const support = createHabit({ id: 'support', name: 'Support' });

    const snapshot = buildModernStatsSnapshot([strong, growing, support], '4w', referenceDate, 'UTC');

    expect(snapshot.focusHabits.map((habit) => habit.focus)).toEqual(['strong', 'growing', 'support']);
    expect(new Set(snapshot.focusHabits.map((habit) => habit.id)).size).toBe(3);
  });
});

describe('compact analytics contract', () => {
  it.each([
    ['1w', 7],
    ['4w', 28],
    ['12w', 84]
  ] as const)('builds %s windows and fixed history', (window, length) => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const snapshot = buildModernStatsSnapshot([createHabit({
      completions: Object.fromEntries(Array.from({ length: 84 }, (_, index) => {
        const date = new Date('2026-04-24T12:00:00.000Z');
        date.setUTCDate(date.getUTCDate() + index);
        return [calendarDateToCompletionKey(date.toISOString().slice(0, 10)), 1];
      }))
    })], window, referenceDate, 'UTC');

    expect(snapshot.strong[0]?.heatmap).toHaveLength(length);
    expect(snapshot.habitModels[0]?.heatmap).toHaveLength(length);
    expect(snapshot.historyDays).toHaveLength(84);
    expect(snapshot.currentWeek.length).toBeGreaterThanOrEqual(4);
  });

  it.each([
    ['1w', 7],
    ['4w', 28],
    ['12w', 84]
  ] as const)('uses scheduled opportunities only and exposes pp delta for %s', (window, length) => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const completions: Record<string, number> = {};
    const currentStart = new Date(referenceDate);
    currentStart.setUTCDate(currentStart.getUTCDate() - length + 1);
    for (let offset = 0; offset < length; offset += 1) {
      const date = new Date(currentStart);
      date.setUTCDate(date.getUTCDate() + offset);
      completions[calendarDateToCompletionKey(date.toISOString().slice(0, 10))] = 1;
    }
    const snapshot = buildModernStatsSnapshot([createHabit({ completions })], window, referenceDate, 'UTC');

    expect(snapshot.summary).toEqual({ completionRate: 100, completed: length, scheduled: length, delta: 100 });
    expect(snapshot.strong[0]?.delta).toBe(100);
    expect(snapshot.strong[0]?.completed).toBe(length);
  });

  it.each(['1w', '4w', '12w'] as const)('returns an unavailable delta when the previous %s window has no opportunities', (window) => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const snapshot = buildModernStatsSnapshot([
      createHabit({ createdAt: '2026-07-16T11:00:00.000Z' })
    ], window, referenceDate, 'UTC');

    expect(snapshot.summary.delta).toBeNull();
  });

  it('classifies deterministically with disjoint sections and neutral unscheduled cells', () => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const attention = createHabit({ id: 'attention', name: 'Alpha', completions: {} });
    const strong = createHabit({
      id: 'strong',
      name: 'Zulu',
      completions: Object.fromEntries(Array.from({ length: 7 }, (_, index) => [
        calendarDateToCompletionKey(`2026-07-${String(10 + index).padStart(2, '0')}`), 1
      ]))
    });
    const weekly = createHabit({
      id: 'weekly',
      name: 'Weekly',
      frequency: 'custom',
      schedule: { type: 'weekly_days', weekdays: [1] }
    });
    const snapshot = buildModernStatsSnapshot([attention, strong, weekly], '1w', referenceDate, 'UTC');

    expect(snapshot.needsAttention.map((habit) => habit.id)).toEqual(['attention', 'weekly']);
    expect(snapshot.strong.map((habit) => habit.id)).toEqual(['strong']);
    expect(snapshot.needsAttention.some((habit) => snapshot.strong.some((item) => item.id === habit.id))).toBe(false);
    expect(snapshot.habitModels.find((habit) => habit.id === 'weekly')?.heatmap.some((cell) => cell.state === 'not scheduled')).toBe(true);
    expect(snapshot.strong[0]?.label).toBe('📚 Zulu');
    expect(weekly).toBeDefined();
  });

  it('keeps 84-day history unchanged when the selected period changes', () => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const habit = createHabit({ completions: buildFridayDipCompletions(referenceDate) });
    const oneWeek = buildModernStatsSnapshot([habit], '1w', referenceDate, 'UTC');
    const twelveWeeks = buildModernStatsSnapshot([habit], '12w', referenceDate, 'UTC');

    expect(oneWeek.historyDays).toEqual(twelveWeeks.historyDays);
    expect(oneWeek.history).toEqual(twelveWeeks.history);
  });
});
