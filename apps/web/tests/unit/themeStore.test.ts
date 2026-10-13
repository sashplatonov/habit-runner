import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_WORKSPACE_PREFERENCES, type DashboardPreferences, type UserPreferences } from '@habbit-runner/shared';
import type { SaveUserPreferencesRequest } from '$lib/api/theme';

const { fetchUserPreferences, saveUserPreferences } = vi.hoisted(() => ({
  fetchUserPreferences: vi.fn<() => Promise<UserPreferences>>(),
  saveUserPreferences: vi.fn<(preferences: SaveUserPreferencesRequest) => Promise<UserPreferences>>()
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

function serverPreferences(dashboard = defaultPreferences, revision = 1): UserPreferences {
  return {
    theme: 'cloud',
    timezone: 'Europe/Belgrade',
    dashboard,
    workspace: {
      ...DEFAULT_WORKSPACE_PREFERENCES,
      dashboard: { ...DEFAULT_WORKSPACE_PREFERENCES.dashboard, ...dashboard }
    },
    revision
  };
}

function confirmedFromRequest(preferences: SaveUserPreferencesRequest): UserPreferences {
  const dashboard: DashboardPreferences = {
    version: 1,
    filter: preferences.workspace.dashboard.filter,
    tags: [...preferences.workspace.dashboard.tags],
    sort: preferences.workspace.dashboard.sort,
    density: preferences.workspace.dashboard.density,
    themeUsage: Object.fromEntries(preferences.workspace.themeUsage.map((entry) => [entry.theme, entry.count]))
  };
  return serverPreferences(dashboard, (preferences.revision ?? 0) + 1);
}

function preferencesFromWorkspace(workspace: UserPreferences['workspace'], revision: number): UserPreferences {
  return {
    ...serverPreferences({
      ...defaultPreferences,
      filter: workspace.dashboard.filter,
      tags: workspace.dashboard.tags,
      sort: workspace.dashboard.sort,
      density: workspace.dashboard.density,
      themeUsage: Object.fromEntries(workspace.themeUsage.map((entry) => [entry.theme, entry.count]))
    }, revision),
    workspace
  };
}

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
  saveUserPreferences.mockReset().mockImplementation(async (preferences) => confirmedFromRequest(preferences));
});

describe('themeStore dashboard preference persistence', () => {
  it('keeps a view change made during hydration and saves it after login sync is ready', async () => {
    let resolvePreferences: ((value: UserPreferences) => void) | undefined;
    fetchUserPreferences.mockReturnValue(new Promise((resolve) => { resolvePreferences = resolve; }));
    const store = createThemeStore();

    const initialization = store.initialize(true);
    await vi.waitFor(() => expect(fetchUserPreferences).toHaveBeenCalledTimes(1));

    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    resolvePreferences?.(serverPreferences());
    await initialization;

    expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
    expect(saveUserPreferences).toHaveBeenCalledWith(expect.objectContaining({
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ sort: 'smart', density: 'compact' })
      })
    }));
  });

  it('restores server-confirmed list settings after a fresh login with no browser state', async () => {
    let serverDashboard = defaultPreferences;
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    fetchUserPreferences.mockImplementation(async () => serverPreferences(serverDashboard));
    saveUserPreferences.mockImplementation(async (preferences) => {
      serverDashboard = {
        ...serverDashboard,
        sort: preferences.workspace.dashboard.sort,
        density: preferences.workspace.dashboard.density
      };
      return confirmedFromRequest(preferences);
    });

    const firstLogin = createThemeStore();
    await firstLogin.initialize(true);
    await firstLogin.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });

    window.localStorage.clear();
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    const secondLogin = createThemeStore();
    await secondLogin.initialize(true);

    expect(get(secondLogin).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
  });

  it('replays an unconfirmed setting change after logging in again', async () => {
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    saveUserPreferences.mockRejectedValueOnce(new Error('Temporary API failure'));

    const firstLogin = createThemeStore();
    await firstLogin.initialize(true);
    await firstLogin.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    await firstLogin.setAuthenticated(false);

    saveUserPreferences.mockImplementation(async (preferences) => confirmedFromRequest(preferences));
    const secondLogin = createThemeStore();
    await secondLogin.initialize(true);

    expect(saveUserPreferences).toHaveBeenLastCalledWith(expect.objectContaining({
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ sort: 'smart', density: 'compact' })
      })
    }));
    expect(get(secondLogin).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
  });

});

describe('themeStore preference sync recovery', () => {

  it('does nothing when retrying without pending intent', async () => {
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    const store = createThemeStore();

    await store.initialize(true);
    await store.retrySync();

    expect(saveUserPreferences).not.toHaveBeenCalled();
  });

  it('retries retained intent repeatedly without losing optimistic workspace state', async () => {
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    saveUserPreferences
      .mockRejectedValueOnce(new Error('Temporary API failure'))
      .mockImplementation(async (request) => preferencesFromWorkspace(request.workspace, (request.revision ?? 0) + 1));
    const store = createThemeStore();

    await store.initialize(true);
    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart' });
    expect(get(store).dashboard.sort).toBe('smart');
    expect(get(store).syncError).toBe('Temporary API failure');

    await Promise.all([store.retrySync(), store.retrySync()]);

    expect(saveUserPreferences).toHaveBeenCalledTimes(2);
    expect(get(store).dashboard.sort).toBe('smart');
    expect(get(store).syncError).toBeNull();
  });

  it('retains a failed dashboard mutation when a later progress mutation succeeds', async () => {
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    saveUserPreferences
      .mockRejectedValueOnce(new Error('Temporary API failure'))
      .mockImplementation(async (request) => ({
        ...preferencesFromWorkspace(request.workspace, (request.revision ?? 0) + 1),
        theme: request.theme,
        timezone: request.timezone
      }));
    const store = createThemeStore();

    await store.initialize(true);
    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart' });
    await store.setProgressPeriod('12w');

    expect(saveUserPreferences).toHaveBeenLastCalledWith(expect.objectContaining({
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ sort: 'smart' }),
        progress: { period: '12w' }
      })
    }));
    expect(get(store).workspace).toMatchObject({
      dashboard: { sort: 'smart' }, progress: { period: '12w' }
    });
  });

  it('builds queued writes from the latest confirmed revision', async () => {
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    let releaseFirstSave: ((value: UserPreferences) => void) | undefined;
    saveUserPreferences
      .mockReturnValueOnce(new Promise((resolve) => { releaseFirstSave = resolve; }))
      .mockImplementation(async (request) => preferencesFromWorkspace(request.workspace, (request.revision ?? 0) + 1));
    const store = createThemeStore();

    await store.initialize(true);
    const first = store.setProgressPeriod('12w');
    await vi.waitFor(() => expect(saveUserPreferences).toHaveBeenCalledTimes(1));
    const second = store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart' });
    const firstRequest = saveUserPreferences.mock.calls[0][0];
    releaseFirstSave?.(preferencesFromWorkspace(firstRequest.workspace, (firstRequest.revision ?? 0) + 1));
    await Promise.all([first, second]);

    expect(saveUserPreferences).toHaveBeenNthCalledWith(2, expect.objectContaining({
      revision: 2,
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ sort: 'smart' }),
        progress: { period: '12w' }
      })
    }));
  });

  it('rebases every pending mutation after a conflict and retains remote sections', async () => {
    const initial = serverPreferences();
    const remoteWorkspace = {
      ...initial.workspace,
      dashboard: { ...initial.workspace.dashboard, searchQuery: 'remote query' }
    };
    const remote = preferencesFromWorkspace(remoteWorkspace, 2);
    fetchUserPreferences.mockResolvedValue(initial);
    saveUserPreferences
      .mockRejectedValueOnce(new Error('Temporary API failure'))
      .mockRejectedValueOnce(Object.assign(new Error('Preferences conflict'), {
        name: 'PreferencesConflictError', current: remote
      }))
      .mockImplementation(async (request) => preferencesFromWorkspace(request.workspace, (request.revision ?? 0) + 1));
    const store = createThemeStore();

    await store.initialize(true);
    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart' });
    await store.setProgressPeriod('12w');

    expect(saveUserPreferences).toHaveBeenLastCalledWith(expect.objectContaining({
      revision: 2,
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ searchQuery: 'remote query', sort: 'smart' }),
        progress: { period: '12w' }
      })
    }));
    expect(get(store).workspace).toMatchObject({
      dashboard: { searchQuery: 'remote query', sort: 'smart' }, progress: { period: '12w' }
    });
  });

  it('replays all pending mutations for the authenticated user after reload', async () => {
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    fetchUserPreferences.mockResolvedValue(serverPreferences());
    saveUserPreferences
      .mockRejectedValueOnce(new Error('Dashboard unavailable'))
      .mockRejectedValueOnce(new Error('Progress unavailable'))
      .mockImplementation(async (request) => preferencesFromWorkspace(request.workspace, (request.revision ?? 0) + 1));
    const firstLogin = createThemeStore();

    await firstLogin.initialize(true);
    await firstLogin.setDashboardPreferences({ ...defaultPreferences, sort: 'smart' });
    await firstLogin.setProgressPeriod('12w');
    await firstLogin.setAuthenticated(false);

    const secondLogin = createThemeStore();
    await secondLogin.initialize(true);

    expect(saveUserPreferences).toHaveBeenLastCalledWith(expect.objectContaining({
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ sort: 'smart' }),
        progress: { period: '12w' }
      })
    }));
  });

});

describe('themeStore conflict recovery', () => {

  it('rebases a progress change over an independent remote dashboard change after a conflict', async () => {
    const initial = serverPreferences();
    const remoteWorkspace = {
      ...initial.workspace,
      dashboard: { ...initial.workspace.dashboard, searchQuery: 'device-a' }
    };
    const remote = preferencesFromWorkspace(remoteWorkspace, 2);
    fetchUserPreferences.mockResolvedValue(initial);
    saveUserPreferences.mockRejectedValueOnce(Object.assign(new Error('Preferences conflict'), {
      name: 'PreferencesConflictError', current: remote
    })).mockImplementationOnce(async (request) => preferencesFromWorkspace(request.workspace, 3));
    const store = createThemeStore();

    await store.initialize(true);
    await store.setProgressPeriod('12w');

    expect(saveUserPreferences).toHaveBeenNthCalledWith(2, expect.objectContaining({
      revision: 2,
      workspace: expect.objectContaining({
        dashboard: expect.objectContaining({ searchQuery: 'device-a' }),
        progress: { period: '12w' }
      })
    }));
    expect(get(store).workspace).toMatchObject({
      dashboard: { searchQuery: 'device-a' }, progress: { period: '12w' }
    });
  });
});


describe('workspace login lifecycle', () => {
  it('waits for real preferences and retries a failed login hydration', async () => {
    const saved = serverPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    fetchUserPreferences.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue(saved);
    const store = createThemeStore();

    await store.initialize(true);
    expect(get(store).serverSyncReady).toBe(false);
    await store.retrySync();

    expect(get(store).serverSyncReady).toBe(true);
    expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
    expect(saveUserPreferences).not.toHaveBeenCalled();
  });

  it('shares hydration when root and protected layouts initialize together', async () => {
    let release: ((value: UserPreferences) => void) | undefined;
    fetchUserPreferences.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    const store = createThemeStore();
    const first = store.setAuthenticated(true);
    const second = store.initialize(true);
    expect(fetchUserPreferences).toHaveBeenCalledTimes(1);
    release?.(serverPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' }));
    await Promise.all([first, second]);
    expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
  });

  it('restores saved sort and density on the same store after logout and login', async () => {
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    let remote = serverPreferences();
    fetchUserPreferences.mockImplementation(async () => remote);
    saveUserPreferences.mockImplementation(async (request) => {
      remote = confirmedFromRequest(request);
      return remote;
    });
    const store = createThemeStore();
    await store.initialize(true);
    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    window.localStorage.removeItem('habbitRunner.auth.session');
    await store.setAuthenticated(false);
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    await store.setAuthenticated(true);

    expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
  });

  it('ignores an old login response and keeps another account free of pending changes', async () => {
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
    let release: ((value: UserPreferences) => void) | undefined;
    fetchUserPreferences.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }))
      .mockResolvedValue(serverPreferences());
    const store = createThemeStore();
    const oldLogin = store.initialize(true);
    await store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
    window.localStorage.removeItem('habbitRunner.auth.session');
    await store.setAuthenticated(false);
    window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-2' }));
    await store.setAuthenticated(true);
    release?.(serverPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' }));
    await oldLogin;

    expect(get(store).dashboard).toMatchObject({ sort: 'custom', density: 'comfortable' });
    expect(saveUserPreferences).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('hr_workspace_pending_v1:user-1')).not.toBeNull();
    expect(window.localStorage.getItem('hr_workspace_pending_v1:user-2')).toBeNull();
  });
});


it('ignores a preference save that completes after logout and replays its outbox on login', async () => {
  window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
  fetchUserPreferences.mockResolvedValue(serverPreferences());
  let release: ((value: UserPreferences) => void) | undefined;
  saveUserPreferences.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
  const store = createThemeStore();
  await store.initialize(true);
  const saving = store.setDashboardPreferences({ ...defaultPreferences, sort: 'smart', density: 'compact' });
  await vi.waitFor(() => expect(saveUserPreferences).toHaveBeenCalledTimes(1));
  window.localStorage.removeItem('habbitRunner.auth.session');
  await store.setAuthenticated(false);
  release?.(confirmedFromRequest(saveUserPreferences.mock.calls[0][0]));
  await saving;
  expect(get(store).isAuthenticated).toBe(false);
  expect(window.localStorage.getItem('hr_workspace_pending_v1:user-1')).not.toBeNull();

  window.localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'user-1' }));
  await store.setAuthenticated(true);
  expect(get(store).dashboard).toMatchObject({ sort: 'smart', density: 'compact' });
  expect(window.localStorage.getItem('hr_workspace_pending_v1:user-1')).toBeNull();
});
