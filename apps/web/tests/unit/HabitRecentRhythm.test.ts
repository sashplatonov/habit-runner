import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HabitRecentRhythm from '$lib/components/habits/HabitRecentRhythm.svelte';
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

function renderRhythm(onSetStatus = vi.fn().mockResolvedValue(undefined), habit = makeHabit()) {
  return {
    onSetStatus,
    ...render(HabitRecentRhythm, {
      habit,
      accent: HABIT_COLOR_THEMES.blue,
      referenceDate: new Date('2026-07-18T12:00:00Z'),
      timeZone: 'UTC',
      onSetStatus
    })
  };
}

describe('HabitRecentRhythm', () => {
  it('renders one calendar with explicit past, current, and upcoming states', () => {
    renderRhythm();

    expect(screen.getByRole('heading', { name: 'Your 28-day rhythm' })).toBeTruthy();
    expect(screen.getAllByRole('group', { name: 'Habit rhythm by day' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Jul 16: Frozen/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jul 17: Done/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jul 18: Missed, today/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jul 19: Upcoming/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit history' })).toBeNull();
  });

  it('moves the single rhythm calendar to the previous 28-day window', async () => {
    const user = userEvent.setup();
    renderRhythm();

    expect(screen.getByText('Jul 5, 2026 – Aug 1, 2026')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Show previous 28 days' }));

    expect(screen.getByText('Jun 7, 2026 – Jul 4, 2026')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show next 28 days' }).hasAttribute('disabled')).toBe(false);
  });

  it('keeps the current day stable in the user time zone', () => {
    render(HabitRecentRhythm, {
      habit: makeHabit(),
      accent: HABIT_COLOR_THEMES.blue,
      referenceDate: new Date('2026-07-18T00:30:00Z'),
      timeZone: 'America/Los_Angeles',
      onSetStatus: vi.fn().mockResolvedValue(undefined)
    });

    expect(screen.getByRole('button', { name: /Jul 17: Done, today/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jul 18: Upcoming/ })).toBeTruthy();
  });

  it('opens the custom status menu from a day and applies a status', async () => {
    const user = userEvent.setup();
    const { onSetStatus } = renderRhythm();

    await user.click(screen.getByRole('button', { name: /Jul 17: Done/ }));

    expect(screen.getByRole('dialog', { name: 'Set status for Jul 17' })).toBeTruthy();
    const menu = screen.getByRole('dialog', { name: 'Set status for Jul 17' });
    expect(within(menu).getByText('Done')).toBeTruthy();
    expect(within(menu).getByText('Missed')).toBeTruthy();
    expect(within(menu).getByText('Upcoming')).toBeTruthy();
    expect(within(menu).getByText('Frozen')).toBeTruthy();
    expect(within(menu).getByText('Rest day')).toBeTruthy();

    await user.click(within(menu).getByRole('button', { name: /Missed/ }));
    expect(onSetStatus).toHaveBeenCalledWith('2026-07-17', 'missed');
  });

  it('shows future and rest-day statuses as schedule-controlled values', async () => {
    const user = userEvent.setup();
    renderRhythm();

    await user.click(screen.getByRole('button', { name: /Jul 19: Upcoming/ }));

    const menu = screen.getByRole('dialog', { name: 'Set status for Jul 19' });
    expect(within(menu).getByRole('button', { name: /Done/ }).hasAttribute('disabled')).toBe(true);
    expect(within(menu).getByText('Set automatically for future dates')).toBeTruthy();
    expect(within(menu).getByText('Set automatically by the habit schedule')).toBeTruthy();
  });
});
