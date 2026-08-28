import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressHabitRow from '$lib/components/stats/ProgressHabitRow.svelte';
import type { HabitAnalyticsModel } from '$lib/stats/modernStats';

const model = {
  id: 'habit-1',
  habit: { name: 'Read', icon: '📚' },
  label: '📚 Read',
  completionRate: 80,
  completed: 4,
  scheduled: 5,
  delta: 10,
  trend: [0, 1, 1, 0, 1],
  heatmap: Array.from({ length: 5 }, (_, index) => ({ calendarDate: `2026-07-0${index + 1}`, state: 'completed' as const, intensity: 1 })),
  insight: 'A consistently strong rhythm',
  reason: 'High completion rate',
  currentStreak: 3,
  longestStreak: 5
} as unknown as HabitAnalyticsModel;

describe('ProgressHabitRow', () => {
  it('renders a compact row with a status badge and seven-day activity strip', () => {
    render(ProgressHabitRow, { props: { model, detailHref: '/showcase/habit/habit-1' } });

    expect(screen.getByRole('link', { name: '📚 Read' }).getAttribute('href')).toBe('/showcase/habit/habit-1');
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByRole('list', { name: '📚 Read activity' }).querySelectorAll('[role="listitem"]')).toHaveLength(5);
    expect(screen.getByRole('article').querySelector('svg')).toBeTruthy();
  });
});
