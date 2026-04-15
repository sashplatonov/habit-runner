import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HabitForm from '../../src/lib/components/HabitForm.svelte';
import type { Habit } from '../../src/types/habit';

const BASE_HABIT: Habit = {
  id: 'habit-1',
  name: 'Deep Work',
  description: 'Protect a focused block.',
  color: 'blue',
  icon: '⚡',
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
    tags: overrides.tags ?? [],
    schedule: overrides.schedule ?? { type: 'daily' },
    completions: overrides.completions ?? {},
    freezeDays: overrides.freezeDays ?? [],
    ...(overrides.customDays ? { customDays: overrides.customDays } : {}),
    ...(overrides.reminderTime ? { reminderTime: overrides.reminderTime } : {})
  };
}

describe('HabitForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows and dismisses the soft-limit warning for over-limit create flows', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });

    render(HabitForm, {
      props: {
        mode: 'create',
        allHabits: [createHabit({ id: '1' }), createHabit({ id: '2' }), createHabit({ id: '3' })],
        onBack: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined)
      }
    });

    expect(screen.getByText('Focus is key')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'I understand, add anyway' }));

    expect(screen.queryByText('Focus is key')).toBeNull();
  });

  it('restores legacy tag and custom icon controls on edit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });

    render(HabitForm, {
      props: {
        mode: 'edit',
        habit: createHabit(),
        allHabits: [createHabit()],
        onBack: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined)
      }
    });

    const customIconInput = screen.getByPlaceholderText('Own...') as HTMLInputElement;
    await user.type(customIconInput, '🛰');

    expect(customIconInput.value).toBe('🛰');

    await user.click(screen.getByRole('button', { name: '+health' }));

    expect(screen.getByText('#health')).toBeTruthy();
  });

  it('preserves advanced monthly-week schedules on submit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, {
      props: {
        mode: 'edit',
        habit: createHabit({
          id: 'habit-42',
          frequency: 'daily',
          schedule: { type: 'monthly_weeks', weeksOfMonth: [1, 'last'], weekdays: [1, 5] },
          reminderTime: '08:30',
          reminderEnabled: true
        }),
        allHabits: [createHabit({ id: 'habit-42' })],
        onBack: vi.fn(),
        onSubmit
      }
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      frequency: 'custom',
      customDays: [1, 5],
      schedule: { type: 'monthly_weeks', weeksOfMonth: [1, 'last'], weekdays: [1, 5] },
      reminderTime: '08:30',
      reminderEnabled: true
    }));
  });
});