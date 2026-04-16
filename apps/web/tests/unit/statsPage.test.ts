import { describe, expect, it } from 'vitest';
import { toCompletionKey } from '../../src/lib/completionKey.js';
import {
  buildDayDetails,
  buildPeriodSegments,
  cleanupHiddenHabits,
  generateDailyCompletionData,
  generateHabitPeriodData
} from '../../src/lib/stats/statsPage.js';
import type { Habit } from '../../src/types/habit';

const BASE_HABIT: Habit = {
  id: 'habit-1',
  name: 'Reading',
  description: 'Read a few pages.',
  color: 'blue',
  icon: '📚',
  tags: ['mind'],
  frequency: 'daily',
  schedule: { type: 'daily' },
  targetStreak: 21,
  dailyTarget: 1,
  completions: {},
  freezeDays: [],
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-04-15T09:00:00.000Z',
  version: 1,
  archived: false,
  sortOrder: 0,
  type: 'positive',
  reminderEnabled: true
};

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    ...BASE_HABIT,
    ...overrides,
    tags: overrides.tags ?? BASE_HABIT.tags,
    schedule: overrides.schedule ?? BASE_HABIT.schedule,
    completions: overrides.completions ?? {},
    freezeDays: overrides.freezeDays ?? []
  };
}

describe('statsPage helpers', () => {
  it('groups quarter segments by week inside each month', () => {
    const segments = buildPeriodSegments('quarter', new Date('2026-04-15T12:00:00.000Z'));

    expect(segments.length).toBeGreaterThan(3);
    expect(segments.every((segment) => segment.label.includes('Week'))).toBe(true);
    expect(new Set(segments.map((segment) => segment.label.split(' · ')[0])).size).toBeGreaterThanOrEqual(3);
  });

  it('aggregates completion rates across custom period segments', () => {
    const segmentAStart = new Date(2026, 3, 1);
    const segmentAEnd = new Date(2026, 3, 4);
    const segmentBStart = new Date(2026, 3, 4);
    const segmentBEnd = new Date(2026, 3, 7);

    const habits = [
      createHabit({
        completions: {
          [toCompletionKey(new Date(2026, 3, 1))]: 1,
          [toCompletionKey(new Date(2026, 3, 2))]: 1,
          [toCompletionKey(new Date(2026, 3, 4))]: 1
        }
      }),
      createHabit({
        id: 'habit-2',
        name: 'Workout',
        icon: '💪',
        color: 'green',
        completions: {
          [toCompletionKey(new Date(2026, 3, 2))]: 1,
          [toCompletionKey(new Date(2026, 3, 5))]: 1,
          [toCompletionKey(new Date(2026, 3, 6))]: 1
        }
      })
    ];

    const segments = [
      { start: segmentAStart, end: segmentAEnd, label: 'Apr 26 · Week 1' },
      { start: segmentBStart, end: segmentBEnd, label: 'Apr 26 · Week 2' }
    ];

    const result = generateDailyCompletionData(habits, segmentAStart, segmentBEnd, 'quarter', segments);

    expect(result).toEqual([
      expect.objectContaining({ day: 'Apr 26 · Week 1', rate: 50, completed: 3, total: 6 }),
      expect.objectContaining({ day: 'Apr 26 · Week 2', rate: 50, completed: 3, total: 6 })
    ]);
  });

  it('builds per-habit trend rows for the period trend chart', () => {
    const segmentAStart = new Date(2026, 3, 1);
    const segmentAEnd = new Date(2026, 3, 4);
    const segmentBStart = new Date(2026, 3, 4);
    const segmentBEnd = new Date(2026, 3, 7);

    const habits = [
      createHabit({
        completions: {
          [toCompletionKey(new Date(2026, 3, 1))]: 1,
          [toCompletionKey(new Date(2026, 3, 2))]: 1,
          [toCompletionKey(new Date(2026, 3, 4))]: 1
        }
      }),
      createHabit({
        id: 'habit-2',
        name: 'Workout',
        icon: '💪',
        color: 'green',
        completions: {
          [toCompletionKey(new Date(2026, 3, 2))]: 1,
          [toCompletionKey(new Date(2026, 3, 5))]: 1,
          [toCompletionKey(new Date(2026, 3, 6))]: 1
        }
      })
    ];

    const segments = [
      { start: segmentAStart, end: segmentAEnd, label: 'Apr 26 · Week 1' },
      { start: segmentBStart, end: segmentBEnd, label: 'Apr 26 · Week 2' }
    ];

    const result = generateHabitPeriodData(habits, segments);

    expect(result).toEqual([
      { period: 'Apr 26 · Week 1', Reading: 67, Workout: 33 },
      { period: 'Apr 26 · Week 2', Reading: 33, Workout: 67 }
    ]);
  });

  it('cleans hidden habits and builds detailed day labels', () => {
    const doneKey = toCompletionKey(new Date(2026, 3, 3));
    const habits = [
      createHabit({ completions: { [doneKey]: 1 } }),
      createHabit({ id: 'habit-2', name: 'Workout', icon: '💪', color: 'green' })
    ];

    expect(cleanupHiddenHabits(['Reading', 'Missing'], habits)).toEqual(['Reading']);
    expect(buildDayDetails(habits)).toEqual({
      [doneKey]: ['📚 Reading']
    });
  });
});