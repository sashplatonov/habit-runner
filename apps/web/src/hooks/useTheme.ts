import { useEffect, useState } from 'react';
import { fetchUserPreferences, saveUserPreferences } from '@/lib/api/theme';
import {
  getBrowserTimeZone,
  getCurrentUserTimeZone,
  setCurrentUserTimeZone
} from '@/lib/time/userTimezone';

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
}];


const STORAGE_KEY = 'habit-theme';

export function useTheme(isAuthenticated = false) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && THEMES.some((t) => t.id === stored)) {
        return stored as ThemeId;
      }
    } catch {
      return 'cloud';
    }
    return 'cloud';
  });
  const [timezone, setTimezoneState] = useState<string>(() => getCurrentUserTimeZone());
  const [serverSyncReady, setServerSyncReady] = useState(!isAuthenticated);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setCurrentUserTimeZone(timezone);
  }, [timezone]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTimezoneState(getBrowserTimeZone());
      setServerSyncReady(false);
      return;
    }

    let cancelled = false;
    setServerSyncReady(false);

    const hydrateTheme = async () => {
      try {
        const remotePreferences = await fetchUserPreferences();
        if (cancelled) {
          return;
        }
        if (
          remotePreferences.theme &&
          THEMES.some((candidate) => candidate.id === remotePreferences.theme)
        ) {
          setThemeState(remotePreferences.theme as ThemeId);
        }
        if (remotePreferences.timezone) {
          setTimezoneState(setCurrentUserTimeZone(remotePreferences.timezone));
        }
      } catch {
        // Theme sync should not block app usage when API is temporarily unavailable.
      } finally {
        if (!cancelled) {
          setServerSyncReady(true);
        }
      }
    };

    void hydrateTheme();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !serverSyncReady) {
      return;
    }

    const persistTheme = async () => {
      try {
        await saveUserPreferences({ theme, timezone });
      } catch {
        // Keep local theme if remote preference update fails.
      }
    };

    void persistTheme();
  }, [isAuthenticated, serverSyncReady, theme, timezone]);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
  };

  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return { theme, setTheme, currentTheme, timezone };
}
