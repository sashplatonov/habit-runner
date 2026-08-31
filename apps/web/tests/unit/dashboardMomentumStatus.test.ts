import { describe, expect, it } from 'vitest';
import { getDashboardMomentumStatus } from '$lib/habits/dashboardMomentumStatus';
import type { Habit } from '@/types/habit';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Read',
    description: '',
    color: 'blue',
    icon: '📚',
    tags: [],
    frequency: 'daily',
    customDays: [],
    schedule: undefined,
    targetStreak: 30,
    dailyTarget: 1,
    completions: {},
    freezeDays: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    version: 1,
    archived: false,
    sortOrder: 1,
    type: 'positive',
    ...overrides
  };
}

describe('dashboard momentum status', () => {
  it('shows a flame for a current scheduled streak', () => {
    const result = getDashboardMomentumStatus(habit({
      completions: {
        '2026-08-08T00:00:00Z': 1,
        '2026-08-07T00:00:00Z': 1
      }
    }), new Date('2026-08-08T12:00:00Z'), 'UTC');

    expect(result).toMatchObject({ kind: 'flame', streak: 2, label: '2 day streak' });
  });

  it('shows ice after seven scheduled misses following a successful completion', () => {
    const result = getDashboardMomentumStatus(habit({
      completions: { '2026-08-01T00:00:00Z': 1 }
    }), new Date('2026-08-08T12:00:00Z'), 'UTC');

    expect(result).toMatchObject({ kind: 'ice', inactiveScheduledDays: 7 });
  });

  it('exposes consecutive scheduled misses before the ice threshold for the streak pill', () => {
    const result = getDashboardMomentumStatus(habit({
      completions: { '2026-08-05T00:00:00Z': 1 }
    }), new Date('2026-08-08T12:00:00Z'), 'UTC');

    expect(result).toMatchObject({ kind: 'none', inactiveScheduledDays: 3 });
  });

  it('keeps no-history, negative, frozen, and unscheduled habits neutral', () => {
    expect(getDashboardMomentumStatus(habit(), new Date('2026-08-08T12:00:00Z'), 'UTC').kind).toBe('none');
    expect(getDashboardMomentumStatus(habit({ type: 'negative' }), new Date('2026-08-08T12:00:00Z'), 'UTC').kind).toBe('flame');
    expect(getDashboardMomentumStatus(habit({ freezeDays: ['2026-08-08'] }), new Date('2026-08-08T12:00:00Z'), 'UTC').kind).toBe('none');
    expect(getDashboardMomentumStatus(habit({ frequency: 'custom', customDays: [1] }), new Date('2026-08-08T12:00:00Z'), 'UTC').kind).toBe('none');
  });

  it('does not count frozen days as inactivity', () => {
    const result = getDashboardMomentumStatus(habit({
      completions: { '2026-08-01T00:00:00Z': 1 },
      freezeDays: ['2026-08-04']
    }), new Date('2026-08-08T12:00:00Z'), 'UTC');

    expect(result.kind).toBe('none');
    expect(result.inactiveScheduledDays).toBe(6);
  });
});
