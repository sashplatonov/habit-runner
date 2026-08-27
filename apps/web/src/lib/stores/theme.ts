import { get, writable, type Readable, type Writable } from 'svelte/store';
import { fetchUserPreferences, saveUserPreferences } from '$lib/api/theme';
import type { DashboardPreferences, UserPreferences } from '@habbit-runner/shared';
import { dashboardPreferencesStore } from '$lib/stores/dashboardPreferences';
import {
  clearPendingDashboardPreferences,
  persistPendingDashboardPreferences,
  readPendingDashboardPreferences
} from '$lib/dashboard/preferences';
import { logClientError } from '$lib/logging/clientLogger';
import { readAuthSession } from '$lib/auth/session';
import {
  DEFAULT_THEME_ID,
  getTheme,
  THEMES,
  type Theme,
  type ThemeId
} from '$lib/theme/themes';
import {
  getBrowserTimeZone,
  getCurrentUserTimeZone,
  setCurrentUserTimeZone
} from '$lib/time/userTimezone';

const STORAGE_KEY = 'habit-theme';

export interface ThemeStoreSnapshot {
  theme: ThemeId;
  currentTheme: Theme;
  timezone: string;
  serverSyncReady: boolean;
  isAuthenticated: boolean;
  dashboard: DashboardPreferences;
}

export interface ThemeStore extends Readable<ThemeStoreSnapshot> {
  initialize: (isAuthenticated?: boolean) => Promise<void>;
  setTheme: (theme: ThemeId) => Promise<void>;
  setTimezone: (timezone: string) => Promise<void>;
  setDashboardPreferences: (preferences: DashboardPreferences) => Promise<void>;
  recordThemeSelection: (themeId: ThemeId) => Promise<void>;
  setAuthenticated: (isAuthenticated: boolean) => Promise<void>;
}

function resolveStoredTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return 'cloud';
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const matchingTheme = THEMES.find((theme) => theme.id === storedTheme);
    return matchingTheme?.id ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

function resolveCurrentTheme(themeId: ThemeId): Theme {
  return getTheme(themeId);
}

function updateThemeColorMeta(themeColor: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', themeColor);
  }
}

export function applyTheme(themeId: ThemeId, persist = true) {
  if (typeof document === 'undefined') {
    return;
  }

  const theme = resolveCurrentTheme(themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  updateThemeColorMeta(theme.themeColor);
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Keep the current theme in memory when storage is unavailable.
    }
  }
}

function createSnapshot(
  theme: ThemeId,
  timezone: string,
  serverSyncReady: boolean,
  isAuthenticated: boolean,
  dashboard: DashboardPreferences
) {
  return {
    theme,
    currentTheme: resolveCurrentTheme(theme),
    timezone,
    serverSyncReady,
    isAuthenticated,
    dashboard
  };
}

function currentUserId(): string | null {
  return readAuthSession()?.userId ?? null;
}

function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

function logPreferenceFailure(event: string, error: unknown): void {
  logClientError(event, 'Failed to synchronize user preferences', {
    error: error instanceof Error ? error.message : String(error)
  });
}

function createPreferenceSync(store: Writable<ThemeStoreSnapshot>) {
  let hydrating = false;
  let persistQueue = Promise.resolve();
  let pendingDashboard: DashboardPreferences | null = null;

  function currentPendingDashboard(): DashboardPreferences | null {
    return pendingDashboard ?? readPendingDashboardPreferences(currentUserId());
  }

  function applyConfirmedDashboard(dashboard: DashboardPreferences, expected: DashboardPreferences): void {
    if (get(store).dashboard !== expected) {
      return;
    }
    const current = get(store);
    store.set(createSnapshot(current.theme, current.timezone, true, true, dashboardPreferencesStore.hydrate(dashboard)));
    pendingDashboard = null;
    clearPendingDashboardPreferences(currentUserId());
  }

  function persist(): Promise<void> {
    const state = get(store);
    if (!state.isAuthenticated || !state.serverSyncReady) {
      return Promise.resolve();
    }
    const request = { theme: state.theme, timezone: state.timezone, dashboard: state.dashboard };
    persistQueue = persistQueue.catch(() => undefined).then(async () => {
      try {
        const confirmed = await saveUserPreferences(request);
        applyConfirmedDashboard(confirmed.dashboard, request.dashboard);
      } catch (error) {
        logPreferenceFailure('theme.persist_failed', error);
      }
    });
    return persistQueue;
  }

  function applyRemotePreferences(remote: UserPreferences): void {
    const initial = get(store);
    const theme = isThemeId(remote.theme) ? remote.theme : initial.theme;
    const timezone = remote.timezone ? setCurrentUserTimeZone(remote.timezone) : initial.timezone;
    const pending = currentPendingDashboard();
    const dashboard = pending
      ? dashboardPreferencesStore.update(pending)
      : dashboardPreferencesStore.hydrate(remote.dashboard);
    pendingDashboard = pending;
    applyTheme(theme);
    store.set(createSnapshot(theme, timezone, true, true, dashboard));
  }

  async function hydrate(): Promise<void> {
    const state = get(store);
    if (!state.isAuthenticated || hydrating) {
      return;
    }
    hydrating = true;
    store.update((current) => createSnapshot(current.theme, current.timezone, false, current.isAuthenticated, current.dashboard));
    try {
      applyRemotePreferences(await fetchUserPreferences());
    } catch (error) {
      logPreferenceFailure('theme.hydrate_failed', error);
      const dashboard = currentPendingDashboard() ?? get(store).dashboard;
      store.update((current) => createSnapshot(current.theme, current.timezone, true, current.isAuthenticated, dashboard));
    } finally {
      hydrating = false;
    }
    if (pendingDashboard) {
      await persist();
    }
  }

  return {
    hydrate,
    persist,
    setPending(dashboard: DashboardPreferences) {
      pendingDashboard = dashboard;
      persistPendingDashboardPreferences(currentUserId(), dashboard);
    },
    reset() {
      pendingDashboard = null;
    }
  };
}

export function createThemeStore(): ThemeStore {
  const store = writable(
    createSnapshot(resolveStoredTheme(), getCurrentUserTimeZone(), false, false, dashboardPreferencesStore.useLegacyFallback())
  );
  let initialized = false;
  const preferenceSync = createPreferenceSync(store);
  return {
    subscribe: store.subscribe,
    async initialize(isAuthenticated = false) {
      const initialTheme = resolveStoredTheme();
      const initialTimezone = isAuthenticated ? getCurrentUserTimeZone() : getBrowserTimeZone();
      const initialDashboard = isAuthenticated
        ? dashboardPreferencesStore.reset()
        : dashboardPreferencesStore.useLegacyFallback();

      applyTheme(initialTheme);
      setCurrentUserTimeZone(initialTimezone);
      store.set(createSnapshot(initialTheme, initialTimezone, !isAuthenticated, isAuthenticated, initialDashboard));

      initialized = true;
      if (isAuthenticated) {
        await preferenceSync.hydrate();
      }
    },
    async setTheme(theme) {
      const state = get(store);
      applyTheme(theme, true);
      store.set(createSnapshot(theme, state.timezone, state.serverSyncReady, state.isAuthenticated, state.dashboard));
      await preferenceSync.persist();
    },
    async setTimezone(timezone) {
      const state = get(store);
      const normalizedTimezone = setCurrentUserTimeZone(timezone);
      store.set(createSnapshot(state.theme, normalizedTimezone, state.serverSyncReady, state.isAuthenticated, state.dashboard));
      await preferenceSync.persist();
    },
    async setDashboardPreferences(preferences) {
      const state = get(store);
      const dashboard = dashboardPreferencesStore.update(preferences);
      preferenceSync.setPending(dashboard);
      store.set(createSnapshot(state.theme, state.timezone, state.serverSyncReady, state.isAuthenticated, dashboard));
      await preferenceSync.persist();
    },
    async recordThemeSelection(themeId) {
      const state = get(store);
      await this.setDashboardPreferences({ ...state.dashboard, themeUsage: { ...state.dashboard.themeUsage, [themeId]: (state.dashboard.themeUsage[themeId] ?? 0) + 1 } });
    },
    async setAuthenticated(isAuthenticated) {
      const state = get(store);
      if (!initialized) {
        await this.initialize(isAuthenticated);
        return;
      }

      if (!isAuthenticated) {
        preferenceSync.reset();
        const browserTimeZone = getBrowserTimeZone();
        setCurrentUserTimeZone(browserTimeZone);
        store.set(createSnapshot(state.theme, browserTimeZone, false, false, dashboardPreferencesStore.reset()));
        return;
      }

      store.set(createSnapshot(state.theme, state.timezone, false, true, dashboardPreferencesStore.reset()));
      await preferenceSync.hydrate();
    }
  };
}

export const themeStore = createThemeStore();
