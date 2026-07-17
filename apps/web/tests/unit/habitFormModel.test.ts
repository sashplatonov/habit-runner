import { describe, expect, it } from 'vitest';
import { buildInitialValues, buildLegacyScheduleFields, calculateSoftLimitWarning, normalizeTags, validateHabitForm } from '$lib/habits/habitFormModel';
import type { Habit } from '@/types/habit';

describe('habitFormModel', () => {
  it('builds initial values from a habit and preserves schedule shape', () => {
    const habit: Habit = {
      id: 'habit-1',
      name: 'Read',
      description: 'Read daily',
      color: 'blue',
      icon: '📚',
      tags: ['focus'],
      frequency: 'daily',
      targetStreak: 21,
      dailyTarget: 1,
      completions: {},
      freezeDays: [],
      createdAt: '2026-07-17T00:00:00Z',
      archived: false,
      sortOrder: 0,
      type: 'positive',
      reminderTime: '08:00',
      reminderEnabled: true
    };

    const values = buildInitialValues(habit);

    expect(values.name).toBe('Read');
    expect(values.icon).toBe('📚');
    expect(values.schedule.type).toBe('daily');
    expect(values.reminderEnabled).toBe(true);
  });

  it('serializes legacy weekly schedules and normalizes tags', () => {
    const schedule = buildLegacyScheduleFields({ type: 'weekly_days', weekdays: [1, 3, 5] });

    expect(schedule.frequency).toBe('custom');
    expect(schedule.customDays).toEqual([1, 3, 5]);
    expect(normalizeTags('  Focus!  ', ['work'])).toEqual(['work', 'focus']);
  });

  it('returns validation errors for empty or incomplete forms', () => {
    const errors = validateHabitForm({
      name: '',
      schedule: { type: 'weekly_days', weekdays: [] }
    });

    expect(errors.name).toBe('Name is required');
    expect(errors.schedule).toBe('Select at least one weekday');
  });

  it('does not count archived habits toward the active habit soft limit', () => {
    const archivedHabit = {
      id: 'habit-archived',
      name: 'Archived',
      description: '',
      color: 'blue',
      icon: '📦',
      tags: [],
      frequency: 'daily',
      targetStreak: 21,
      dailyTarget: 1,
      completions: {},
      freezeDays: [],
      createdAt: '2026-07-01T00:00:00Z',
      archived: true,
      sortOrder: 0,
      type: 'positive',
      reminderEnabled: false
    } satisfies Habit;

    expect(calculateSoftLimitWarning([archivedHabit, archivedHabit, archivedHabit])).toBe(false);
  });
});
