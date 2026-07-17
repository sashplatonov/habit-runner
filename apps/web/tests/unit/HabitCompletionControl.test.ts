import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HabitCompletionControl from '$lib/components/habits/HabitCompletionControl.svelte';

function renderControl(overrides: Record<string, unknown> = {}) {
  const onToggle = vi.fn();
  render(HabitCompletionControl, {
    props: {
      label: 'Complete 📚 Read',
      completed: false,
      target: 3,
      count: 2,
      accent: '#4e63d8',
      scheduled: true,
      onToggle,
      ...overrides
    }
  });
  return onToggle;
}

describe('HabitCompletionControl', () => {
  it('shows multi-target progress and invokes the action', async () => {
    const user = userEvent.setup();
    const onToggle = renderControl();
    const button = screen.getByRole('button', { name: 'Complete 📚 Read' });

    expect(screen.getByText('2/3')).toBeTruthy();
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('exposes pending state and prevents duplicate mutations', async () => {
    const user = userEvent.setup();
    const onToggle = renderControl({ pending: true });
    const button = screen.getByRole('button', { name: 'Complete 📚 Read' }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    await user.click(button);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('keeps frozen state disabled with an accessible label', () => {
    renderControl({ label: '📚 Read is frozen today', frozen: true });

    const button = screen.getByRole('button', { name: '📚 Read is frozen today' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
