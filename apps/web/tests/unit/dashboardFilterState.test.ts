import { describe, expect, it } from 'vitest';
import type { Habit } from '../../src/types/habit';

// Mock dashboard filter logic extracted for testability
type DashboardFilter = 'pending' | 'all' | 'done' | 'archived';

function isHabitCompletedOnDate(habit: Habit, dateKey: string, dailyTarget: number): boolean {
  if (habit.type === 'negative') {
    return (habit.completions[dateKey] ?? 0) === 0;
  }
  return (habit.completions[dateKey] ?? 0) >= dailyTarget;
}

function filterDashboardHabits(
  habits: Habit[],
  filter: DashboardFilter,
  todayKey: string,
  isMandatoryToday: (habit: Habit, date: Date) => boolean,
  todayDate: Date
): Habit[] {
  if (filter === 'archived') {
    return habits.filter((h) => h.archived);
  }

  return habits.filter((h) => {
    if (h.archived) { return false; }

    if (filter === 'pending') {
      if (!isMandatoryToday(h, todayDate)) { return false; }
      return !isHabitCompletedOnDate(h, todayKey, Math.max(1, h.dailyTarget ?? 1));
    }
    if (filter === 'done') {
      if (!isMandatoryToday(h, todayDate)) { return false; }
      return isHabitCompletedOnDate(h, todayKey, Math.max(1, h.dailyTarget ?? 1));
    }
    return true;
  });
}

describe('dashboardFilterState', () => {
  const todayKey = '2026-05-08';
  const todayDate = new Date('2026-05-08T00:00:00.000Z');

  const baseHabit = (overrides: Partial<Habit> = {}): Habit => ({
    id: 'habit-1',
    name: 'Test Habit',
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
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-04-15T09:00:00.000Z',
    version: 1,
    archived: false,
    sortOrder: 0,
    type: 'positive',
    reminderEnabled: false,
    ...overrides
  });

  const mockIsMandatoryToday = () => true;

  it('returns only archived habits for archived filter', () => {
    const habits = [
      baseHabit({ archived: false }),
      baseHabit({ id: 'habit-2', archived: true }),
      baseHabit({ id: 'habit-3', archived: true })
    ];

    const result = filterDashboardHabits(habits, 'archived', todayKey, mockIsMandatoryToday, todayDate);
    expect(result).toHaveLength(2);
    expect(result.every((h) => h.archived)).toBe(true);
  });

  it('returns pending habits for pending filter', () => {
    const habits = [
      baseHabit({ completions: { [todayKey]: 1 } }), // done
      baseHabit({ id: 'habit-2', completions: {} }), // pending
      baseHabit({ id: 'habit-3', completions: { [todayKey]: 0 } }) // pending
    ];

    const result = filterDashboardHabits(habits, 'pending', todayKey, mockIsMandatoryToday, todayDate);
    expect(result).toHaveLength(2);
    expect(result.map((h) => h.id)).toEqual(['habit-2', 'habit-3']);
  });

  it('returns done habits for done filter', () => {
    const habits = [
      baseHabit({ completions: { [todayKey]: 1 } }), // done
      baseHabit({ id: 'habit-2', completions: {} }), // pending
      baseHabit({ id: 'habit-3', completions: { [todayKey]: 2 } }) // done (over target)
    ];

    const result = filterDashboardHabits(habits, 'done', todayKey, mockIsMandatoryToday, todayDate);
    expect(result).toHaveLength(2);
    expect(result.map((h) => h.id)).toEqual(['habit-1', 'habit-3']);
  });

  it('returns all non-archived habits for all filter', () => {
    const habits = [
      baseHabit({ archived: false }),
      baseHabit({ id: 'habit-2', archived: true }),
      baseHabit({ id: 'habit-3', archived: false })
    ];

    const result = filterDashboardHabits(habits, 'all', todayKey, mockIsMandatoryToday, todayDate);
    expect(result).toHaveLength(2);
    expect(result.every((h) => !h.archived)).toBe(true);
  });

  it('respects daily target for completion check', () => {
    const habits = [
      baseHabit({ dailyTarget: 3, completions: { [todayKey]: 2 } }), // not done (2 < 3)
      baseHabit({ id: 'habit-2', dailyTarget: 3, completions: { [todayKey]: 3 } }) // done
    ];

    const result = filterDashboardHabits(habits, 'done', todayKey, mockIsMandatoryToday, todayDate);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('habit-2');
  });
});
