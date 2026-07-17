import { describe, expect, it } from 'vitest';
import { buildHabitDetailViewModel } from '$lib/habits/habitDetailViewModel';
import type { Habit, HabitStats } from '@/types/habit';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Read',
    description: 'Read daily',
    color: 'blue',
    icon: '📚',
    tags: [],
    frequency: 'daily',
    targetStreak: 21,
    dailyTarget: 1,
    completions: { '2026-07-17T00:00:00Z': 1 },
    freezeDays: [],
    createdAt: '2026-07-01T00:00:00Z',
    archived: false,
    sortOrder: 0,
    type: 'positive',
    reminderTime: '08:00',
    reminderEnabled: true,
    ...overrides
  };
}

const stats: HabitStats = {
  totalDays: 1,
  completedDays: 1,
  currentStreak: 1,
  longestStreak: 3,
  completionRate: 100,
  automatismScore: 42,
  weeklyData: [],
  monthlyData: []
};

describe('habitDetailViewModel', () => {
  it('builds a motivating ready state with rhythm cells and milestones', () => {
    const model = buildHabitDetailViewModel(makeHabit(), stats, new Date('2026-07-17T12:00:00Z'), 'UTC');

    expect(model.loadState).toBe('ready');
    expect(model.operationalState).toBe('complete');
    expect(model.habitLabel).toBe('📚 Read');
    expect(model.nextMilestoneLabel).toContain('days');
    expect(model.rhythmCells).toHaveLength(28);
    expect(model.rhythmCells.some((cell) => cell.state === 'completed')).toBe(true);
    expect(model.rhythmCells.every((cell) => /^\d{1,2}$/.test(cell.shortLabel))).toBe(true);
  });

  it('keeps calendar labels and weekday schedules stable across time zones', () => {
    const model = buildHabitDetailViewModel(
      makeHabit({
        schedule: { type: 'weekly_days', weekdays: [5] }
      }),
      stats,
      new Date('2026-07-17T18:00:00Z'),
      'America/Los_Angeles'
    );

    const today = model.rhythmCells.find((cell) => cell.isToday);
    expect(today?.label).toBe('Jul 17');
    expect(today?.state).toBe('completed');
  });

  it('marks unscheduled habits as not scheduled today', () => {
    const model = buildHabitDetailViewModel(
      makeHabit({
        schedule: { type: 'weekly_days', weekdays: [1] }
      }),
      stats,
      new Date('2026-07-17T12:00:00Z'),
      'UTC'
    );

    expect(model.todayLabel).toBe('Not scheduled today');
    expect(model.recoveryCopy).toContain('Not scheduled today');
  });
});
