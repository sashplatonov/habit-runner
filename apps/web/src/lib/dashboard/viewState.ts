export type DashboardFilter = 'pending' | 'all' | 'done' | 'archived';

export function shouldShowDashboardOnboarding(totalHabitCount: number) {
  return totalHabitCount === 0;
}

export function normalizeDashboardFilter(
  currentFilter: DashboardFilter,
  activeHabitCount: number,
  archivedHabitCount: number
): DashboardFilter {
  if (activeHabitCount === 0 && archivedHabitCount > 0 && currentFilter !== 'archived') {
    return 'archived';
  }

  return currentFilter;
}
