import { expect, test } from 'vitest';
import type { Habit } from '../../src/types/habit.js';
import {
  calculateScheduledCompletionRate,
  calculateScheduledStreak
} from '../../src/lib/habits/schedule.js';

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit',
    name: 'Habit',
    description: '',
    color: 'blue',
    icon: '⚡',
    tags: [],
    frequency: 'daily',
    schedule: { type: 'daily' },
    targetStreak: 21,
    dailyTarget: 1,
    completions: {},
    freezeDays: [],
    createdAt: new Date().toISOString(),
    archived: false,
    sortOrder: 0,
    ...overrides
  };
}

test('calculateScheduledStreak matches consecutive scheduled days', () => {
  const habit = createHabit({
    completions: {
      '2026-03-06': 1,
      '2026-03-05': 1,
      '2026-03-04': 1
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-06T00:00:00Z'));
  expect(result).toEqual({ current: 3, longest: 3 });
});

test('calculateScheduledCompletionRate covers daily schedule window', () => {
  const habit = createHabit({
    completions: {
      '2026-03-01': 1,
      '2026-03-03': 1,
      '2026-03-04': 1
    }
  });

  const rate = calculateScheduledCompletionRate(habit, habit.completions, new Date('2026-03-04T00:00:00Z'));
  expect(rate).toBe(10);
});

test('calculateScheduledStreak and rate handle weekly quota schedules', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [1, 2] },
    completions: {
      '2026-03-01': 1,
      '2026-03-02': 1,
      '2026-02-22': 1,
      '2026-02-23': 1,
      '2026-02-15': 1,
      '2026-02-16': 1
    }
  });

  const reference = new Date('2026-03-07T00:00:00Z');
  const streak = calculateScheduledStreak(habit, habit.completions, reference);
  const rate = calculateScheduledCompletionRate(habit, habit.completions, reference);

  expect(streak).toEqual({ current: 3, longest: 3 });
  expect(rate).toBe(25);
});
