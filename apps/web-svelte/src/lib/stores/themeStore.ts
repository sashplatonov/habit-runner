import { writable, derived, get } from 'svelte/store';
import { fetchUserPreferences, saveUserPreferences } from '$lib/api/theme';
import {
  getBrowserTimeZone,
  getCurrentUserTimeZone,
  setCurrentUserTimeZone
} from '$lib/time/userTimezone';
import { sessionStore } from './sessionStore';

export type ThemeId =
  'midnight' |
  'ember' |
  'violet' |
  'matrix' |
  'arctic' |
  'sakura' |
  'lavender' |
  'mint' |
  'peach' |
  'cloud';

export interface Theme {
  id: ThemeId;
  name: string;
  accent: string;
  accentSecondary: string;
  group: 'dark' | 'light';
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    accent: '#00d4ff',
    accentSecondary: '#00ff88',
    group: 'dark'
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#ff8c42',
    accentSecondary: '#ff4d6a',
    group: 'dark'
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#bf6bff',
    accentSecondary: '#ff6bb5',
    group: 'dark'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    accent: '#33ff33',
    accentSecondary: '#00cc66',
    group: 'dark'
  },
  {
    id: 'arctic',
    name: 'Arctic',
    accent: '#64b5f6',
    accentSecondary: '#e0e0e0',
    group: 'dark'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    accent: '#e8457a',
    accentSecondary: '#c44dbb',
    group: 'light'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    accent: '#7c5cbf',
    accentSecondary: '#5b8def',
    group: 'light'
  },
  {
    id: 'mint',
    name: 'Mint',
    accent: '#2eaa6e',
    accentSecondary: '#1a8fb8',
    group: 'light'
  },
  {
    id: 'peach',
    name: 'Peach',
    accent: '#e07830',
    accentSecondary: '#d04880',
    group: 'light'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    accent: '#4a7aef',
    accentSecondary: '#3abba0',
    group: 'light'
  }
];

const STORAGE_KEY = 'habit-theme';

function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'cloud';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch {
    // Ignore storage errors
  }
  return 'cloud';
}

function createThemeStore() {
  const theme = writable<ThemeId>(readStoredTheme());
  const timezone = writable<string>(getCurrentUserTimeZone());
  let serverSyncReady = false;

  const currentTheme = derived(theme, ($theme) =>
    THEMES.find((t) => t.id === $theme) ?? THEMES[0]
  );

  function applyTheme(id: ThemeId) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id);
    }
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore storage errors
    }
  }

  // React to theme changes
  theme.subscribe((value) => {
    applyTheme(value);
  });

  // React to timezone changes
  timezone.subscribe((value) => {
    setCurrentUserTimeZone(value);
  });

  async function hydrateFromServer() {
    serverSyncReady = false;
    try {
      const remotePreferences = await fetchUserPreferences();
      if (
        remotePreferences.theme &&
        THEMES.some((candidate) => candidate.id === remotePreferences.theme)
      ) {
        theme.set(remotePreferences.theme as ThemeId);
      }
      if (remotePreferences.timezone) {
        timezone.set(setCurrentUserTimeZone(remotePreferences.timezone));
      }
    } catch {
      // Theme sync should not block app usage
    } finally {
      serverSyncReady = true;
    }
  }

  async function persistToServer() {
    if (!serverSyncReady) return;
    try {
      const currentThemeId = get(theme);
      const currentTz = get(timezone);
      await saveUserPreferences({ theme: currentThemeId, timezone: currentTz });
    } catch {
      // Keep local theme if remote fails
    }
  }

  return {
    theme,
    timezone,
    currentTheme,
    setTheme(id: ThemeId) {
      theme.set(id);
      persistToServer();
    },
    hydrateFromServer,
    resetToDefaults() {
      timezone.set(getBrowserTimeZone());
      serverSyncReady = false;
    }
  };
}

export const themeStore = createThemeStore();
