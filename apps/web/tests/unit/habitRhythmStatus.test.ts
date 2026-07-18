import { describe, expect, it } from 'vitest';
import { buildDayStatusMutation } from '$lib/habits/habitRhythmStatus';
import type { Habit } from '@/types/habit';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Read',
    description: '',
    color: 'blue',
    icon: '📚',
    tags: [],
    frequency: 'daily',
    targetStreak: 21,
    dailyTarget: 3,
    completions: {},
    freezeDays: [],
    createdAt: '2026-07-01T00:00:00Z',
    archived: false,
    sortOrder: 0,
    type: 'positive',
    ...overrides
  };
}

describe('buildDayStatusMutation', () => {
  it('maps positive habit statuses to completion counts', () => {
    const habit = makeHabit();

    expect(buildDayStatusMutation(habit, '2026-07-17', 'completed')).toEqual({ toggleFreeze: false, completionCount: 3 });
    expect(buildDayStatusMutation(habit, '2026-07-17', 'missed')).toEqual({ toggleFreeze: false, completionCount: 0 });
  });

  it('preserves negative habit semantics', () => {
    const habit = makeHabit({ type: 'negative' });

    expect(buildDayStatusMutation(habit, '2026-07-17', 'completed')).toEqual({ toggleFreeze: false, completionCount: 0 });
    expect(buildDayStatusMutation(habit, '2026-07-17', 'missed')).toEqual({ toggleFreeze: false, completionCount: 3 });
  });

  it('unfreezes editable statuses and does not duplicate an existing freeze', () => {
    const habit = makeHabit({ freezeDays: ['2026-07-17'] });

    expect(buildDayStatusMutation(habit, '2026-07-17', 'completed')).toEqual({ toggleFreeze: true, completionCount: 3 });
    expect(buildDayStatusMutation(habit, '2026-07-17', 'frozen')).toEqual({ toggleFreeze: false, completionCount: null });
  });
});
