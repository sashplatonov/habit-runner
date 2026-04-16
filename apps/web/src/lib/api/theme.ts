import { API_BASE_URL } from '@/lib/core/config';
import { authenticatedFetch } from '@/lib/auth/session';
import { THEME_IDS, type ThemeId } from '@/lib/theme/themes';
import type { UserPreferences } from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/auth/preferences`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Preferences fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as UserPreferences;
  return {
    theme: payload.theme,
    timezone: payload.timezone ?? null
  };
}

export async function saveUserPreferences(preferences: { theme: ThemeId; timezone: string }): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/auth/preferences`,
    {
      method: 'PUT',
      body: JSON.stringify(preferences)
    }
  );

  if (!response.ok) {
    throw new Error(`Preferences save failed: ${response.status}`);
  }
}

export async function fetchUserTheme(): Promise<ThemeId | null> {
  const preferences = await fetchUserPreferences();
  return THEME_IDS.has(preferences.theme as ThemeId) ? (preferences.theme as ThemeId) : null;
}

export async function saveUserTheme(theme: ThemeId): Promise<void> {
  await saveUserPreferences({ theme, timezone: getCurrentUserTimeZone() });
}
