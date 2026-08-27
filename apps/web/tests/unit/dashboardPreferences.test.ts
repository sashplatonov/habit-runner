import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  clearPendingDashboardPreferences,
  normalizeDashboardPreferences,
  persistPendingDashboardPreferences,
  readPendingDashboardPreferences,
  readLegacyDashboardPreferences
} from '$lib/dashboard/preferences';
import { createDashboardPreferencesStore } from '$lib/stores/dashboardPreferences';
import { get } from 'svelte/store';

describe('dashboard preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes unsupported values and bounds collections', () => {
    const normalized = normalizeDashboardPreferences({
      filter: 'unknown',
      sort: 'unknown',
      density: 'unknown',
      tags: [' health ', 'health', '', 'x'.repeat(41), 12],
      themeUsage: { cloud: 4, broken: -1 }
    });

    expect(normalized).toEqual({
      ...DEFAULT_DASHBOARD_PREFERENCES,
      tags: ['health'],
      themeUsage: { cloud: 4 }
    });
  });

  it('reads valid legacy local values as a first-paint fallback', () => {
    window.localStorage.setItem('hr_dashboard_filter_v1', JSON.stringify('done'));
    window.localStorage.setItem('hr_dashboard_density_v1', JSON.stringify('compact'));
    window.localStorage.setItem('hr_dashboard_sort_mode_v1', JSON.stringify('smart'));
    window.localStorage.setItem('hr_dashboard_tags_v1', JSON.stringify(['focus']));

    expect(readLegacyDashboardPreferences()).toMatchObject({
      filter: 'done',
      density: 'compact',
      sort: 'smart',
      tags: ['focus']
    });
  });

  it('hydrates account state and keeps updates normalized', () => {
    const store = createDashboardPreferencesStore();
    store.hydrate({ filter: 'archived', tags: ['archive'] });
    expect(get(store).filter).toBe('archived');

    store.update({ ...get(store), density: 'invalid' as 'comfortable' });
    expect(get(store).density).toBe('comfortable');
  });

  it('keeps a pending write isolated to its user account', () => {
    persistPendingDashboardPreferences('user-1', {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      sort: 'smart',
      density: 'compact'
    });

    expect(readPendingDashboardPreferences('user-1')).toMatchObject({ sort: 'smart', density: 'compact' });
    expect(readPendingDashboardPreferences('user-2')).toBeNull();

    clearPendingDashboardPreferences('user-1');
    expect(readPendingDashboardPreferences('user-1')).toBeNull();
  });
});
