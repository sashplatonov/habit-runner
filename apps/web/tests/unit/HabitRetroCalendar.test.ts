import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HabitRetroCalendar from '$lib/components/HabitRetroCalendar.svelte';
import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
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
    dailyTarget: 1,
    completions: { '2026-07-17T00:00:00Z': 1 },
    freezeDays: ['2026-07-16'],
    createdAt: '2026-07-01T00:00:00Z',
    archived: false,
    sortOrder: 0,
    type: 'positive',
    ...overrides
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('HabitRetroCalendar', () => {
  it('presents editable history with explicit day states and accessible navigation', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-18T12:00:00Z'));
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(HabitRetroCalendar, {
      habit: makeHabit(),
      accent: HABIT_COLOR_THEMES.blue,
      onUpdate
    });

    expect(screen.getByRole('heading', { name: 'Retro calendar' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Retro calendar legend' }).textContent).toContain('Completed');
    expect(screen.getByRole('button', { name: 'Show previous history window' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show next history window' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: /2026-07-16, scheduled, frozen/ })).toBeTruthy();

    const completedDay = screen.getByRole('button', { name: /2026-07-17, scheduled, completed/ });
    await user.click(completedDay);

    expect(onUpdate).toHaveBeenCalledWith('2026-07-17T00:00:00Z', 0);
  });

  it('uses the redesigned editor for multi-target history', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-18T12:00:00Z'));
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(HabitRetroCalendar, {
      habit: makeHabit({ dailyTarget: 3 }),
      accent: HABIT_COLOR_THEMES.blue,
      onUpdate
    });

    await user.click(screen.getByRole('button', { name: /2026-07-17, scheduled, 1 of 3 recorded/ }));
    expect(screen.getByRole('dialog', { name: 'Edit completion for 2026-07-17T00:00:00Z' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Add one completion' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalledWith('2026-07-17T00:00:00Z', 2);
  });
});
