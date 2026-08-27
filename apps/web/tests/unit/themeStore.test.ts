import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DashboardPreferences, UserPreferences } from '@habbit-runner/shared';

const { fetchUserPreferences, saveUserPreferences } = vi.hoisted(() => ({
  fetchUserPreferences: vi.fn<() => Promise<UserPreferences>>(),
  saveUserPreferences: vi.fn<(preferences: { theme: string; timezone: string; dashboard?: DashboardPreferences }) => Promise<void>>()
}));

vi.mock('$lib/api/theme', () => ({ fetchUserPreferences, saveUserPreferences }));

import { createThemeStore } from '$lib/stores/theme';

const defaultPreferences: DashboardPreferences = {
  version: 1,
  filter: 'pending',
  tags: [],
  sort: 'custom',
  density: 'comfortable',
  themeUsage: {}
};

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  fetchUserPreferences.mockReset();
  saveUserPreferences.mockReset().mockResolvedValue(undefined);
});

describe('themeStore dashboard preference persistence', () => {
  it('keeps a view change made during hydration and saves it after login sync is ready', async () => {
    let resolvePreferences: ((value: UserPreferences) => void) | undefined;
    fetchUserPreferences.mockReturnValue(new Promise((resolve) => { resolvePreferences = resolve; }));
    const store = createThemeStore();

    const initialization = store.initialize(true);
    await vi.waitFor(() => expect(fetchUserPreferences).toHaveBeenCalledTimes(1));

    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    resolvePreferences?.({ theme: 'cloud', timezone: 'Europe/Belgrade', dashboard: defaultPreferences });
    await initialization;

    expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
    expect(saveUserPreferences).toHaveBeenCalledWith(expect.objectContaining({
      dashboard: expect.objectContaining({ sort: 'smart', density: 'compact' })
    }));
  });
});
