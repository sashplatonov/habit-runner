import { describe, expect, it } from 'vitest';
import type { Habit } from '../../src/types/habit';
import {
  getHabitCompletionActionLabel,
  getHabitCompletionState
} from '../../src/lib/habits/completionState';

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Read',
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
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    version: 1,
    archived: false,
    sortOrder: 0,
    type: 'positive',
    reminderEnabled: false,
    ...overrides
  };
}

describe('habit completion state', () => {
  it('uses the target for positive multi-target habits', () => {
    const habit = createHabit({ dailyTarget: 3, completions: { '2026-07-17': 2 } });
    const state = getHabitCompletionState(habit, '2026-07-17');

    expect(state).toMatchObject({ count: 2, target: 3, completed: false, isNegative: false });
    expect(getHabitCompletionActionLabel(habit.name, state)).toBe('Complete Read');
  });

  it('treats no slip as success for negative habits', () => {
    const habit = createHabit({ type: 'negative' });
    const state = getHabitCompletionState(habit, '2026-07-17');

    expect(state.completed).toBe(true);
    expect(getHabitCompletionActionLabel(habit.name, state)).toBe('Record slip for Read');
  });

  it('offers to undo a recorded negative-habit slip', () => {
    const habit = createHabit({ type: 'negative', completions: { '2026-07-17': 1 } });
    const state = getHabitCompletionState(habit, '2026-07-17');

    expect(state.completed).toBe(false);
    expect(getHabitCompletionActionLabel(habit.name, state)).toBe('Undo slip for Read');
  });
});
