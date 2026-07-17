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
