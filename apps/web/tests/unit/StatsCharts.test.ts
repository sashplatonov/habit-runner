import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StatsDailyRateChart from '../../src/lib/components/StatsDailyRateChart.svelte';
import StatsTrendChart from '../../src/lib/components/StatsTrendChart.svelte';
import type { Habit } from '../../src/types/habit';

const BASE_HABIT: Habit = {
  id: 'habit-1',
  name: 'Reading',
  description: 'Read a few pages.',
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
  reminderEnabled: true
};

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    ...BASE_HABIT,
    ...overrides,
    schedule: overrides.schedule ?? BASE_HABIT.schedule,
    tags: overrides.tags ?? [],
    completions: overrides.completions ?? {},
    freezeDays: overrides.freezeDays ?? []
  };
}

describe('stats chart components', () => {
  it('renders quarter labels and the legacy chart guide for the daily rate card', () => {
    render(StatsDailyRateChart, {
      props: {
        avgRate: 63,
        period: 'quarter',
        dailyData: [
          { day: 'Jan 26 · Week 1', axisLabel: 'Jan 26 · Week 1', completed: 2, total: 4, rate: 50 },
          { day: 'Jan 26 · Week 2', axisLabel: 'Jan 26 · Week 2', completed: 3, total: 4, rate: 75 },
          { day: 'Feb 26 · Week 1', axisLabel: 'Feb 26 · Week 1', completed: 1, total: 4, rate: 25 }
        ]
      }
    });

    expect(screen.getByText('Daily completion rate')).toBeTruthy();
    expect(screen.getByLabelText('Chart guide: Daily completion rate')).toBeTruthy();
    expect(screen.getAllByText('W1').length).toBeGreaterThan(0);
    expect(screen.getByText('Jan 26')).toBeTruthy();
    expect(screen.getByText('Feb 26')).toBeTruthy();
  });

  it('renders only visible trend lines while keeping all visibility toggles', () => {
    const { container } = render(StatsTrendChart, {
      props: {
        period: 'quarter',
        hiddenHabits: ['Workout'],
        toggleHabitVisibility: vi.fn(),
        filteredHabits: [
          createHabit(),
          createHabit({ id: 'habit-2', name: 'Workout', icon: '💪', color: 'green' })
        ],
        habitPeriodData: [
          { period: 'Jan 26 · Week 1', Reading: 50, Workout: 20 },
          { period: 'Jan 26 · Week 2', Reading: 70, Workout: 40 },
          { period: 'Feb 26 · Week 1', Reading: 80, Workout: 60 }
        ]
      }
    });

    expect(screen.getByText('Period trends')).toBeTruthy();
    expect(screen.getByLabelText('Chart guide: Period trends')).toBeTruthy();
    expect(screen.getByRole('button', { name: '📚 Reading' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '💪 Workout' })).toBeTruthy();
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
  });
});