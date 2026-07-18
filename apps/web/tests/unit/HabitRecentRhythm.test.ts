import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import HabitRecentRhythm from '$lib/components/habits/HabitRecentRhythm.svelte';
import type { HabitDetailRhythmCell } from '$lib/habits/habitDetailViewModel';
import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
import type { Habit } from '@/types/habit';

const cells: HabitDetailRhythmCell[] = [
  { dateKey: '2026-07-16', label: 'Jul 16', shortLabel: '16', state: 'missed', count: 0, isToday: false },
  { dateKey: '2026-07-17', label: 'Jul 17', shortLabel: '17', state: 'completed', count: 1, isToday: true },
  { dateKey: '2026-07-18', label: 'Jul 18', shortLabel: '18', state: 'future', count: 0, isToday: false }
];

const habit: Habit = {
  id: 'habit-1',
  name: 'Read',
  description: '',
  color: 'blue',
  icon: '📚',
  tags: [],
  frequency: 'daily',
  targetStreak: 21,
  dailyTarget: 1,
  completions: {},
  freezeDays: [],
  createdAt: '2026-07-01T00:00:00Z',
  archived: false,
  sortOrder: 0,
  type: 'positive'
};

const props = {
  cells,
  habit,
  accent: HABIT_COLOR_THEMES.blue,
  onUpdate: async () => {}
};

describe('HabitRecentRhythm', () => {
  it('explains and labels past, current, and upcoming day states', () => {
    render(HabitRecentRhythm, props);

    expect(screen.getByRole('heading', { name: 'Your 28-day rhythm' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Done');
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Missed');
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Upcoming');
    expect(screen.getByRole('listitem', { name: 'Jul 16: Missed' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Jul 17: Done, today' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Jul 18: Upcoming' })).toBeTruthy();
  });

  it('keeps retroactive editing inside the rhythm surface', async () => {
    const user = userEvent.setup();
    render(HabitRecentRhythm, props);

    await user.click(screen.getByRole('button', { name: 'Edit history' }));

    expect(screen.getByRole('button', { name: 'Edit history' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('group', { name: 'Editable completion history' })).toBeTruthy();
    expect(screen.getByText('Last 28 days')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Retro calendar' })).toBeNull();
  });
});
