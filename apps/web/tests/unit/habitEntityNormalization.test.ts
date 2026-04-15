import { describe, expect, it } from 'vitest';
import { habitEntityToDomain, normalizeCompletions } from '../../src/lib/storage/habitEntity';
import type { HabitEntity } from '../../src/lib/storage/db';

describe('habitEntity normalization', () => {
  it('fills missing legacy fields so dashboard code can render safely', () => {
    const domainHabit = habitEntityToDomain({
      id: 'habit-1',
      userId: 'user-1',
      name: 'Read',
      description: null,
      color: 'blue',
      icon: '📚',
      frequency: 'daily',
      targetStreak: 14,
      dailyTarget: 0,
      tags: undefined,
      customDays: undefined,
      schedule: undefined,
      archived: false,
      completions: undefined,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      version: 1,
      sortOrder: 0,
      reminderTime: null,
      reminderEnabled: undefined,
      freezeDays: undefined,
      type: undefined
    } as unknown as HabitEntity);

    expect(domainHabit.description).toBe('');
    expect(domainHabit.dailyTarget).toBe(1);
    expect(domainHabit.tags).toEqual([]);
    expect(domainHabit.completions).toEqual({});
    expect(domainHabit.freezeDays).toEqual([]);
    expect(domainHabit.reminderEnabled).toBe(true);
    expect(domainHabit.type).toBe('positive');
  });

  it('drops invalid completion payload values', () => {
    expect(
      normalizeCompletions({
        '2026-01-01': 2.8,
        '2026-01-02': 'bad',
        '2026-01-03': Number.NaN,
        '2026-01-04': -3
      })
    ).toEqual({
      '2026-01-01': 2,
      '2026-01-04': 0
    });
  });
});