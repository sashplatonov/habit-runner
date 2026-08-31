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
    onAddHabit: vi.fn()
  });
}

describe('dashboard controls', () => {
  it('shows tag filters below the search without opening view options', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'All tags' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '#health' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Dashboard view options' })).toBeNull();
  });

  it('keeps primary mobile controls touch-sized', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Add habit' }).classList.contains('min-h-11')).toBe(true);
    expect(screen.getByRole('button', { name: 'Open search' }).classList.contains('min-h-11')).toBe(true);
    expect(screen.getByRole('button', { name: 'Sort: Custom' }).classList.contains('min-h-11')).toBe(true);
  });

  it('keeps dashboard filters equal-width and centered beside add habit', () => {
    renderToolbar();

    const filterGroup = screen.getByRole('group', { name: 'Dashboard filter' });
    expect(filterGroup.className).toContain('[&>button]:flex-1');
    expect(filterGroup.className).toContain('[&>button]:justify-center');
    expect(filterGroup.parentElement?.className).toContain('justify-center');
    expect(filterGroup.parentElement?.querySelector('[aria-label="Add habit"]')).toBeTruthy();
  });

  it('toggles inline sort, density, and archived controls', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onSortChange = vi.fn();
    const onDensityChange = vi.fn();
    render(DashboardToolbar, {
      filter: 'archived',
      searchQuery: '',
      sortMode: 'custom',
      viewDensity: 'comfortable',
      pendingCount: 2,
      activeTags: [],
      availableTags: [],
      onFilterChange,
      onSearchChange: vi.fn(),
      onClearSearch: vi.fn(),
      onSortChange,
      onDensityChange,
      onToggleTag: vi.fn(),
      onClearTags: vi.fn(),
      onAddHabit: vi.fn()
    });

    await user.click(screen.getByRole('button', { name: 'Sort: Custom' }));
    await user.click(screen.getByRole('button', { name: 'View density: Cards' }));
    expect(onSortChange).toHaveBeenCalledWith('smart');
    expect(onDensityChange).toHaveBeenCalledWith('compact');

    const archivedButton = screen.getByRole('button', { name: 'Hide archived habits' });
    expect(archivedButton.getAttribute('aria-pressed')).toBe('true');

    await user.click(archivedButton);
    expect(onFilterChange).toHaveBeenCalledWith('all');
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
