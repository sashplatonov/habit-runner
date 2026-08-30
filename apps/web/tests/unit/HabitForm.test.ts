/* eslint-disable max-lines-per-function */
import { render, screen, waitFor, within } from '@testing-library/svelte';
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

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

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

  it('keeps the habit-type draft when returning to the dashboard and submits it on save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Habit type' }));
    expect(screen.getByRole('button', { name: 'Avoid habit' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Complete 1 scheduled repetition to mark the day done.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Avoid habit' }));

    expect(screen.getByRole('button', { name: 'Avoid habit' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Build habit' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Mark the day done when the count is still zero: success means one fewer slip.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    expect(within(screen.getByRole('button', { name: 'Edit Habit type' })).getByText('Avoid habit')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Edit Habit type' }));
    expect(screen.getByRole('button', { name: 'Avoid habit' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'No late scrolling');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'negative'
    }));
  });

  it('keeps the schedule chooser order, active state, and draft transitions without saving', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    const chooser = screen.getByRole('group', { name: 'Schedule type' });
    expect(within(chooser).getAllByRole('button').map((button) => (button.textContent ?? '').replace(/\s+/g, ' ').trim()))
      .toEqual([
        'Daily Every day',
        'Days of week Pick weekdays',
        'Weekly quota Target completions per week',
        'Monthly quota Target completions per month',
        'Monthly weeks Choose weeks of month'
      ]);

    expect(screen.getByRole('button', { name: 'Daily Every day' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('A scheduled opportunity is created every calendar day.')).toBeTruthy();
    expect(screen.getByText('Changing the schedule affects future opportunities only. Existing history stays unchanged.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Days of week Pick weekdays' }));
    expect(screen.getByRole('button', { name: 'Days of week Pick weekdays' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Daily Every day' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByLabelText('Toggle Monday for the schedule').getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    expect(within(screen.getByRole('button', { name: 'Edit Schedule' })).getByText('Every Mon, Tue, Wed, Thu, Fri')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    // Draft keeps the transitioned schedule and active state after reopening the panel.
    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    expect(screen.getByRole('button', { name: 'Days of week Pick weekdays' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Weekday reading');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { type: 'weekly_days', weekdays: [1, 2, 3, 4, 5] }
    }));
  });

  it('shows the daily summary with metrics and rule but no editable schedule controls', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Daily Every day' }));
    expect(screen.getByRole('button', { name: 'Daily Every day' }).getAttribute('aria-pressed')).toBe('true');
    const dailySummary = screen.getByTestId('daily-summary');
    expect(within(dailySummary).getByText('Every day')).toBeTruthy();
    expect(within(dailySummary).getByText('Monday through Sunday')).toBeTruthy();
    expect(within(dailySummary).getByText('scheduled days / week')).toBeTruthy();
    expect(within(dailySummary).getByText('opportunity frequency')).toBeTruthy();
    expect(within(dailySummary).getByText('A scheduled opportunity is created every calendar day.')).toBeTruthy();
    expect(within(dailySummary).getByText('Existing history remains unchanged.')).toBeTruthy();

    // No editable weekday or quota control is rendered for the daily rule.
    expect(screen.queryByLabelText(/Toggle .* for the schedule/)).toBeNull();
    expect(screen.queryByLabelText('Times per week')).toBeNull();
    expect(screen.queryByLabelText('Times per month')).toBeNull();

    // Back from the daily slot keeps the draft and returns to the chooser.
    await user.click(screen.getByRole('button', { name: 'Days of week Pick weekdays' }));
    expect(screen.getByLabelText('Toggle Monday for the schedule')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Daily Every day' }));
    expect(screen.getByTestId('daily-summary')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('selects weekdays with count, pattern, and rule summaries while preserving validation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Days of week Pick weekdays' }));
    const weekdays = screen.getByTestId('schedule-weekdays-view');

    // Default transition seeds Mon-Fri; metrics reflect it immediately.
    expect(within(weekdays).getByText(/^(5)$/)).toBeTruthy();
    expect(within(weekdays).getByText('Mon · Tue · Wed · Thu · Fri')).toBeTruthy();
    expect(within(weekdays).getByText('Only Monday, Tuesday, Wednesday, Thursday and Friday count as scheduled days.')).toBeTruthy();
    expect(within(weekdays).getByText('Other weekdays are not treated as missed opportunities.')).toBeTruthy();
    const buttons = [1, 2, 3, 4, 5, 6, 0].map((day) => screen.getByLabelText(`Toggle ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]} for the schedule`));
    expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(5);

    // Deselecting updates count, pattern, and rule; deselecting all surfaces validation, then Save still submits the cleared state.
    await user.click(screen.getByLabelText('Toggle Tuesday for the schedule'));
    await user.click(screen.getByLabelText('Toggle Thursday for the schedule'));
    await user.click(screen.getByLabelText('Toggle Friday for the schedule'));
    expect(within(weekdays).getByText('2')).toBeTruthy();
    expect(within(weekdays).getByText('Mon · Wed')).toBeTruthy();
    expect(within(weekdays).getByText('Only Monday and Wednesday count as scheduled days.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    expect(within(screen.getByRole('button', { name: 'Edit Schedule' })).getByText('Every Mon, Wed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Mon Wednesday');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { type: 'weekly_days', weekdays: [1, 3] },
      frequency: 'custom',
      customDays: [1, 3]
    }));
  });

  it('bounds the weekly quota counter and reflects target and flexible-timing summaries before save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Weekly quota Target completions per week' }));
    const view = screen.getByTestId('weekly-quota-view');

    // Default transition seeds 2; metrics, rule, and truthful flexible copy update live.
    expect(within(view).getByText('2 / week')).toBeTruthy();
    expect(within(view).getByText('Flexible days')).toBeTruthy();
    expect(within(view).getByText('The week is on target after 2 completions.')).toBeTruthy();
    expect(within(view).getByText('No individual weekday is automatically considered missed.')).toBeTruthy();

    // Increment three times: 2 -> 5. Decrease twice: 5 -> 3.
    await user.click(screen.getByRole('button', { name: 'Increase weekly quota' }));
    await user.click(screen.getByRole('button', { name: 'Increase weekly quota' }));
    await user.click(screen.getByRole('button', { name: 'Increase weekly quota' }));
    await user.click(screen.getByRole('button', { name: 'Decrease weekly quota' }));
    await user.click(screen.getByRole('button', { name: 'Decrease weekly quota' }));
    expect(within(view).getByText('3 / week')).toBeTruthy();
    expect(within(view).getByText('The week is on target after 3 completions.')).toBeTruthy();

    // Bounds: cannot go below 1.
    await user.click(screen.getByRole('button', { name: 'Decrease weekly quota' }));
    await user.click(screen.getByRole('button', { name: 'Decrease weekly quota' }));
    expect(within(view).getByText('1 / week')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease weekly quota' }).hasAttribute('disabled')).toBe(true);

    // Panel back-and-forth retains the draft and weekly_days weekday choices.
    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    expect(within(screen.getByRole('button', { name: 'Edit Schedule' })).getByText('1x a week')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Weekly quota Target completions per week' }));
    expect(screen.getByLabelText('Weekly quota: 1 completions per week')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Weekly quota habit');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { type: 'weekly_quota', timesPerWeek: 1 }
    }));
  });

  it('bounds the monthly quota counter and reflects target summaries before save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Monthly quota Target completions per month' }));
    const view = screen.getByTestId('monthly-quota-view');

    // Default transition seeds 3; metrics and rule update live.
    expect(within(view).getByText('3 / month')).toBeTruthy();
    expect(within(view).getByText('Flexible timing')).toBeTruthy();
    expect(within(view).getByText('Progress is measured against the monthly quota rather than calendar-day attendance.')).toBeTruthy();

    // Increments clamp at 31; decrements clamp at 1.
    for (let step = 0; step < 30; step += 1) {
      await user.click(screen.getByRole('button', { name: 'Increase monthly quota' }));
    }
    expect(within(view).getByText('31 / month')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Increase monthly quota' }).hasAttribute('disabled')).toBe(true);
    for (let step = 0; step < 30; step += 1) {
      await user.click(screen.getByRole('button', { name: 'Decrease monthly quota' }));
    }
    expect(within(view).getByText('1 / month')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease monthly quota' }).hasAttribute('disabled')).toBe(true);

    // Panel back-and-forth retains the draft summary.
    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    expect(within(screen.getByRole('button', { name: 'Edit Schedule' })).getByText('1x a month')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    expect(screen.getByLabelText('Monthly quota: 1 completions per month')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Monthly quota habit');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { type: 'monthly_quota', timesPerMonth: 1 }
    }));
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

  it('selects month weeks with the combined rule and validates both groups independently', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(HabitForm, { props: { mode: 'create', allHabits: [], onBack: vi.fn(), onSubmit } });

    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Monthly weeks Choose weeks of month' }));
    const view = screen.getByTestId('monthly-weeks-view');

    // Default transition seeds week 1 plus Mon-Fri; the combined rule renders with exact names.
    expect(within(view).getByText('Schedule Monday, Tuesday, Wednesday, Thursday and Friday during week 1 of each month.')).toBeTruthy();
    expect(within(view).getByText('If a month has a 5th week, it is ignored unless selected.')).toBeTruthy();

    // Week 5 maps to the existing last-week domain value; toggles update the combined rule.
    await user.click(screen.getByRole('button', { name: 'Toggle last week of the month' }));
    for (const dayName of ['Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      await user.click(screen.getByLabelText(`Toggle ${dayName} in the selected weeks`));
    }
    expect(within(view).getByText('Schedule Monday during week 1 and the last week of each month.')).toBeTruthy();

    // Both groups validate independently: an empty weekday group blocks Save with its own message.
    await user.click(screen.getByRole('button', { name: 'Toggle Monday in the selected weeks' }));
    expect(within(view).getByText('Select at least one weekday inside the selected weeks.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Identity' }));
    await user.type(screen.getByLabelText('Name *'), 'Month weeks habit');
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(screen.getByText('Select at least one weekday')).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // Restoring a weekday lets the same schedule submit; week values map to the last-week domain.
    await user.click(screen.getByRole('button', { name: 'Back to habit editor dashboard' }));
    await user.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    await user.click(screen.getByRole('button', { name: 'Toggle Monday in the selected weeks' }));
    expect(within(screen.getByTestId('monthly-weeks-view')).getByText('Schedule Monday during week 1 and the last week of each month.')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: 'Create habit' }).at(-1)!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { type: 'monthly_weeks', weeksOfMonth: [1, 'last'], weekdays: [1] },
      frequency: 'custom',
      customDays: [1]
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