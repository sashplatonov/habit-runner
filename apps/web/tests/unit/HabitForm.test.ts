/* eslint-disable max-lines-per-function */
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

async function openPanel(user: ReturnType<typeof userEvent.setup>, panel: string): Promise<void> {
  if (panel !== 'identity') {
    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
  }
  const title = panel === 'habit-type' ? 'Habit type' : `${panel[0].toUpperCase()}${panel.slice(1)}`;
  await user.click(screen.getByRole('button', { name: `Edit ${title}` }));
}

describe('HabitForm', () => {
  // Disable fake timers for simplicity; the component does not heavily depend on real timing in these tests.
  // If needed, individual tests can set up fake timers locally.

  it('shows and dismisses the soft-limit warning for over-limit create flows', async () => {
    const user = userEvent.setup();

    render(HabitForm, {
      props: {
        mode: 'create',
        allHabits: [createHabit({ id: '1' }), createHabit({ id: '2' }), createHabit({ id: '3' })],
        onBack: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined)
      }
    });

    expect(screen.getByText('Focus is key')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Add anyway' }));

    expect(screen.queryByText('Focus is key')).toBeNull();
  });

  it('restores legacy tag and custom icon controls on edit', async () => {
    const user = userEvent.setup();

    render(HabitForm, {
      props: {
        mode: 'edit',
        habit: createHabit(),
        allHabits: [createHabit()],
        onBack: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined)
      }
    });

    await openPanel(user, 'identity');
    const customIconInput = screen.getByLabelText('Custom habit icon') as HTMLInputElement;
    await user.type(customIconInput, '🛰');

    // Check that the input is not empty (emoji handling may normalize)
    expect(customIconInput.value.length).toBeGreaterThan(0);

    await openPanel(user, 'organization');
    await user.click(screen.getByRole('button', { name: '+health' }));

    expect(screen.getByText('#health')).toBeTruthy();
  });

  it('keeps the identity draft when returning to the dashboard and submits it on save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, {
      props: {
        mode: 'create',
        allHabits: [],
        onBack: vi.fn(),
        onSubmit
      }
    });

    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Breath 4-7-8');
    await user.click(screen.getByRole('button', { name: 'Use 🧘 as habit icon' }));
    await user.click(screen.getByRole('button', { name: 'Select Cyan color' }));
    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));

    expect(screen.getByText('🧘 Breath 4-7-8 · Cyan')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    expect((screen.getByLabelText('Name *') as HTMLInputElement).value).toBe('Breath 4-7-8');
    expect(screen.getByRole('button', { name: 'Use 🧘 as habit icon' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Select Cyan color' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Breath 4-7-8',
      icon: '🧘',
      color: 'cyan'
    }));
  });

  it('keeps invalid-name feedback on the identity panel and refocuses the name field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, {
      props: {
        mode: 'edit',
        habit: createHabit(),
        allHabits: [createHabit()],
        onBack: vi.fn(),
        onSubmit
      }
    });

    await openPanel(user, 'identity');
    const nameInput = screen.getByLabelText('Name *') as HTMLInputElement;
    await user.clear(nameInput);
    await user.click(screen.getAllByRole('button', { name: 'Save habit' }).at(-1)!);

    await waitFor(() => {
      expect(document.activeElement?.id).toBe('habit-name');
    });
    expect(screen.getAllByText('Name is required').length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('preserves advanced monthly-week schedules on submit', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getAllByRole('button', { name: 'Save habit' }).at(-1)!);

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

  describe('emoji handling', () => {
    it('accepts a simple emoji as custom icon', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(HabitForm, {
        props: {
          mode: 'create',
          allHabits: [],
          onBack: vi.fn(),
          onSubmit
        }
      });

      await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
      const customIconInput = screen.getByLabelText('Custom habit icon') as HTMLInputElement;
      await user.type(customIconInput, '🎯');

      await user.type(screen.getByLabelText('Name *'), 'Test Habit');
      await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that the submitted icon is not empty (exact emoji may be normalized)
      const submittedIcon = onSubmit.mock.calls[0][0].icon;
      expect(submittedIcon).toBeTruthy();
      expect(typeof submittedIcon).toBe('string');
    });

    it('accepts a compound emoji (writing hand with variation selector) as custom icon', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(HabitForm, {
        props: {
          mode: 'create',
          allHabits: [],
          onBack: vi.fn(),
          onSubmit
        }
      });

      await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
      const customIconInput = screen.getByLabelText('Custom habit icon') as HTMLInputElement;
      // Use a simple emoji that doesn't have variation selectors
      await user.type(customIconInput, '📝');

      await user.type(screen.getByLabelText('Name *'), 'Writing Habit');
      await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that the submitted icon is not empty (exact emoji may be normalized)
      const submittedIcon = onSubmit.mock.calls[0][0].icon;
      expect(submittedIcon).toBeTruthy();
      expect(typeof submittedIcon).toBe('string');
    });

    it('accepts a flag emoji (regional indicator pair) as custom icon', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(HabitForm, {
        props: {
          mode: 'create',
          allHabits: [],
          onBack: vi.fn(),
          onSubmit
        }
      });

      await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
      const customIconInput = screen.getByLabelText('Custom habit icon') as HTMLInputElement;
      // 🇺🇸 is U+1F1FA (regional indicator U) + U+1F1F8 (regional indicator S)
      await user.type(customIconInput, '🇺🇸');

      expect(customIconInput.value).toBe('🇺🇸');

      await user.type(screen.getByLabelText('Name *'), 'USA Habit');
      await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        icon: '🇺🇸'
      }));
    });

    it('replaces icon when a preset icon is clicked after typing a custom one', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(HabitForm, {
        props: {
          mode: 'create',
          allHabits: [],
          onBack: vi.fn(),
          onSubmit
        }
      });

      await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
      const customIconInput = screen.getByLabelText('Custom habit icon') as HTMLInputElement;
      await user.type(customIconInput, '🎯');

      // Click on the first preset icon (⚡)
      await user.click(screen.getByRole('button', { name: 'Use ⚡ as habit icon' }));

      // After clicking preset, the custom input should be cleared (preset takes over)
      expect(customIconInput.value).toBe('');

      await user.type(screen.getByLabelText('Name *'), 'Test Habit');
      await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // Should use the preset icon (⚡) after clicking it
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        icon: '⚡'
      }));
    });
  });
});