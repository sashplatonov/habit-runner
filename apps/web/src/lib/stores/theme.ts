import { get, writable, type Readable } from 'svelte/store';
import { fetchUserPreferences, saveUserPreferences } from '$lib/api/theme';
import { logClientError } from '$lib/logging/clientLogger';
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
}

export interface ThemeStore extends Readable<ThemeStoreSnapshot> {
  initialize: (isAuthenticated?: boolean) => Promise<void>;
  setTheme: (theme: ThemeId) => Promise<void>;
  setTimezone: (timezone: string) => Promise<void>;
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

function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') {
    return;
  }

  const theme = resolveCurrentTheme(themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  updateThemeColorMeta(theme.themeColor);
  try {
    window.localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Keep the current theme in memory when storage is unavailable.
  }
}

function createSnapshot(theme: ThemeId, timezone: string, serverSyncReady: boolean, isAuthenticated: boolean) {
  return {
    theme,
    currentTheme: resolveCurrentTheme(theme),
    timezone,
    serverSyncReady,
    isAuthenticated
  };
}

export function createThemeStore(): ThemeStore {
  const store = writable(
    createSnapshot(resolveStoredTheme(), getCurrentUserTimeZone(), false, false)
  );
  let initialized = false;
  let hydrating = false;

  async function persistPreferences() {
    const state = get(store);
    if (!state.isAuthenticated || !state.serverSyncReady) {
      return;
    }

    try {
      await saveUserPreferences({ theme: state.theme, timezone: state.timezone });
    } catch (error) {
      logClientError('theme.persist_failed', 'Failed to persist user theme preferences', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function hydrateFromServer() {
    const state = get(store);
    if (!state.isAuthenticated || hydrating) {
      return;
    }

    hydrating = true;
    store.update((current) => createSnapshot(current.theme, current.timezone, false, current.isAuthenticated));

    try {
      const remotePreferences = await fetchUserPreferences();
      const nextTheme = THEMES.some((theme) => theme.id === remotePreferences.theme as ThemeId)
        ? remotePreferences.theme as ThemeId
        : state.theme;
      const nextTimezone = remotePreferences.timezone
        ? setCurrentUserTimeZone(remotePreferences.timezone)
        : state.timezone;

      applyTheme(nextTheme);
      store.set(createSnapshot(nextTheme, nextTimezone, true, true));
    } catch (error) {
      logClientError('theme.hydrate_failed', 'Failed to hydrate user theme preferences', {
        error: error instanceof Error ? error.message : String(error)
      });
      store.update((current) => createSnapshot(current.theme, current.timezone, true, current.isAuthenticated));
    } finally {
      hydrating = false;
    }
  }

  return {
    subscribe: store.subscribe,
    async initialize(isAuthenticated = false) {
      const initialTheme = resolveStoredTheme();
      const initialTimezone = isAuthenticated ? getCurrentUserTimeZone() : getBrowserTimeZone();

      applyTheme(initialTheme);
      setCurrentUserTimeZone(initialTimezone);
      store.set(createSnapshot(initialTheme, initialTimezone, !isAuthenticated, isAuthenticated));

      initialized = true;
      if (isAuthenticated) {
        await hydrateFromServer();
      }
    },
    async setTheme(theme) {
      const state = get(store);
      applyTheme(theme);
      store.set(createSnapshot(theme, state.timezone, state.serverSyncReady, state.isAuthenticated));
      await persistPreferences();
    },
    async setTimezone(timezone) {
      const state = get(store);
      const normalizedTimezone = setCurrentUserTimeZone(timezone);
      store.set(
        createSnapshot(state.theme, normalizedTimezone, state.serverSyncReady, state.isAuthenticated)
      );
      await persistPreferences();
    },
    async setAuthenticated(isAuthenticated) {
      const state = get(store);
      if (!initialized) {
        await this.initialize(isAuthenticated);
        return;
      }

      if (!isAuthenticated) {
        const browserTimeZone = getBrowserTimeZone();
        setCurrentUserTimeZone(browserTimeZone);
        store.set(createSnapshot(state.theme, browserTimeZone, false, false));
        return;
      }

      store.set(createSnapshot(state.theme, state.timezone, false, true));
      await hydrateFromServer();
    }
  };
}

export const themeStore = createThemeStore();
