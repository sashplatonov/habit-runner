import { describe, expect, test } from 'vitest';
import type { Habit } from '../../src/types/habit.js';
import { buildScheduledCompletionSummary } from '../../src/lib/dashboard/scheduledCompletionSummary.js';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit', name: 'Habit', description: '', color: 'blue', icon: '⚡', tags: [],
    frequency: 'daily', schedule: { type: 'daily' }, targetStreak: 21, dailyTarget: 1,
    completions: {}, freezeDays: [], createdAt: '2026-03-01T09:00:00Z', archived: false,
    sortOrder: 0, type: 'positive', ...overrides
  };
}

describe('buildScheduledCompletionSummary', () => {
  test('builds 30 ordered days and neutral days without required habits', () => {
    const summary = buildScheduledCompletionSummary(
      [habit({ id: 'daily', completions: { '2026-03-20T00:00:00Z': 1 } })],
      new Date('2026-03-20T12:00:00Z'),
      'UTC'
    );

    expect(summary.days).toHaveLength(30);
    expect(summary.days[0].calendarDate).toBe('2026-02-19');
    expect(summary.days.at(-1)?.calendarDate).toBe('2026-03-20');
    expect(summary.days.find((day) => day.calendarDate === '2026-02-19')).toMatchObject({
      state: 'neutral', required: 0, ratio: null, brightnessLevel: null
    });
    expect(summary.perfectDays).toBe(1);
  });

  test('uses schedule and completion semantics for partial targets, negatives, and today segments', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'targeted', dailyTarget: 2, completions: { '2026-03-20T00:00:00Z': 1 } }),
      habit({ id: 'negative', type: 'negative', sortOrder: 1 }),
      habit({ id: 'friday', schedule: { type: 'weekly_days', weekdays: [5] }, sortOrder: 2 })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');

    expect(summary.today).toMatchObject({ completed: 1, required: 3, percentage: 33 });
    expect(summary.today.segments).toEqual([
      { habitId: 'targeted', completed: false },
      { habitId: 'negative', completed: true },
      { habitId: 'friday', completed: false }
    ]);
    expect(summary.days.at(-1)).toMatchObject({ state: 'required', completed: 1, required: 3, brightnessLevel: 2 });
  });

  test('excludes archived, pre-creation, frozen, and unscheduled habits', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'archived', archived: true }),
      habit({ id: 'new', createdAt: '2026-03-20T12:00:00Z' }),
      habit({ id: 'frozen', freezeDays: ['2026-03-20'] }),
      habit({ id: 'weekday', schedule: { type: 'weekly_days', weekdays: [1] } })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');

    expect(summary.today).toMatchObject({ completed: 0, required: 1, percentage: 0 });
    expect(summary.today.segments).toEqual([{ habitId: 'new', completed: false }]);
    expect(summary.days.at(-1)?.state).toBe('required');
  });

  test('evaluates weekly and monthly quota obligations for each calendar cell', () => {
    const summary = buildScheduledCompletionSummary([
      habit({ id: 'weekly', schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [5] } }),
      habit({ id: 'monthly', schedule: { type: 'monthly_quota', timesPerMonth: 2 } })
    ], new Date('2026-03-20T12:00:00Z'), 'UTC');

    expect(summary.today.required).toBe(2);
    expect(summary.today.segments.map((segment) => segment.habitId)).toEqual(['weekly', 'monthly']);
  });

  test('uses the supplied timezone for the calendar boundary', () => {
    const summary = buildScheduledCompletionSummary(
      [habit({ completions: { '2026-03-20T00:00:00Z': 1 } })],
      new Date('2026-03-21T06:30:00Z'),
      'America/Los_Angeles'
    );

    expect(summary.today.calendarDate).toBe('2026-03-20');
    expect(summary.today.completed).toBe(1);
    expect(summary.days.at(-1)?.calendarDate).toBe('2026-03-20');
  });
});
