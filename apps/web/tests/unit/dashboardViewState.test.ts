import { describe, expect, it } from 'vitest';
import {
  normalizeDashboardFilter,
  shouldShowDashboardOnboarding,
  type DashboardFilter
} from '../../src/lib/dashboard/viewState';

describe('dashboard view state', () => {
  it('shows onboarding only after the first hydration confirms there are no habits', () => {
    expect(shouldShowDashboardOnboarding(0, false)).toBe(false);
    expect(shouldShowDashboardOnboarding(0, true)).toBe(true);
    expect(shouldShowDashboardOnboarding(1, true)).toBe(false);
    expect(shouldShowDashboardOnboarding(5, true)).toBe(false);
  });

  it('switches to archived filter when only archived habits exist', () => {
    expect(normalizeDashboardFilter('pending', 0, 2)).toBe('archived');
    expect(normalizeDashboardFilter('all', 0, 2)).toBe('archived');
    expect(normalizeDashboardFilter('done', 0, 2)).toBe('archived');
  });

  it('keeps the current filter when active habits exist or archived tab is already selected', () => {
    const filters: DashboardFilter[] = ['pending', 'all', 'done', 'archived'];

    filters.forEach((filter) => {
      expect(normalizeDashboardFilter(filter, 3, 1)).toBe(filter);
    });

    expect(normalizeDashboardFilter('archived', 0, 4)).toBe('archived');
    expect(normalizeDashboardFilter('pending', 0, 0)).toBe('pending');
  });
});
