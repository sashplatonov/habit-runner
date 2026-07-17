import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DashboardToolbar from '$lib/components/dashboard/DashboardToolbar.svelte';
import TodaySummary from '$lib/components/dashboard/TodaySummary.svelte';
import { buildTodaySummary } from '$lib/dashboard/todaySummary';

function renderToolbar() {
  return render(DashboardToolbar, {
    filter: 'pending',
    searchQuery: '',
    sortMode: 'custom',
    viewDensity: 'comfortable',
    pendingCount: 2,
    activeTags: [],
    availableTags: ['health'],
    onFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    onClearSearch: vi.fn(),
    onSortChange: vi.fn(),
    onDensityChange: vi.fn(),
    onToggleTag: vi.fn(),
    onClearTags: vi.fn(),
    onAddHabit: vi.fn(),
    onExportCsv: vi.fn()
  });
}

describe('dashboard controls', () => {
  it('shows tag filters below the search without opening view options', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'All tags' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '#health' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Dashboard view options' })).toBeNull();
  });

  it('opens and closes view options from the same trigger', async () => {
    const user = userEvent.setup();
    renderToolbar();
    const trigger = screen.getByRole('button', { name: 'View options' });

    await user.click(trigger);
    expect(screen.getByRole('region', { name: 'Dashboard view options' })).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await user.click(trigger);
    expect(screen.queryByRole('region', { name: 'Dashboard view options' })).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes view options with Escape', async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole('button', { name: 'View options' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('region', { name: 'Dashboard view options' })).toBeNull();
  });

  it('renders and invokes the summary next action', async () => {
    const user = userEvent.setup();
    const onPrimaryAction = vi.fn();
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 3,
      completedCount: 1,
      bestStreak: 4,
      daysSinceLastCompletion: 0,
      nextHabitName: 'Read',
      nextHabitId: 'habit-1'
    });

    render(TodaySummary, { summary, dateLabel: 'Friday, Jul 17', onPrimaryAction });
    await user.click(screen.getByRole('button', { name: 'Continue with Read' }));

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
