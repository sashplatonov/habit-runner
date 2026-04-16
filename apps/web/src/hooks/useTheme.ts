import { useEffect, useState } from 'react';
import { fetchUserPreferences, saveUserPreferences } from '@/lib/api/theme';
import { THEMES, type ThemeId } from '@/lib/theme/themes';
import {
  getBrowserTimeZone,
  getCurrentUserTimeZone,
  setCurrentUserTimeZone
} from '@/lib/time/userTimezone';


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
