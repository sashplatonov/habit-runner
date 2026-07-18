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
  completedDays: 1,
  longestStreak: 3
};

describe('habitDetailViewModel', () => {
  it('builds a motivating ready state with milestones', () => {
    const model = buildHabitDetailViewModel(makeHabit(), stats, new Date('2026-07-17T12:00:00Z'), 'UTC');

    expect(model.loadState).toBe('ready');
    expect(model.operationalState).toBe('complete');
    expect(model.habitLabel).toBe('📚 Read');
    expect(model.nextMilestoneLabel).toBe('3-day checkpoint');
    expect(model.nextMilestoneTarget).toBe(3);
    expect(model.currentStreak).toBe(1);
    expect(model.hasCompletionHistory).toBe(true);
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
