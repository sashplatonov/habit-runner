import { API_BASE_URL } from '$lib/core/config';
import { getValidAccessToken } from '$lib/auth/session';
import type { ThemeId } from '$lib/stores/themeStore';
import type { UserPreferences } from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';

async function withAuthHeaders(init: RequestInit = {}): Promise<RequestInit> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Authentication required');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  return { ...init, headers };
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch(
    `${API_BASE_URL}/auth/preferences`,
    await withAuthHeaders({ method: 'GET' })
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
  const response = await fetch(
    `${API_BASE_URL}/auth/preferences`,
    await withAuthHeaders({
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  );

  if (!response.ok) {
    throw new Error(`Preferences save failed: ${response.status}`);
  }
}

export async function fetchUserTheme(): Promise<ThemeId | null> {
  const THEME_IDS = new Set<ThemeId>([
    'midnight', 'ember', 'violet', 'matrix', 'arctic',
    'sakura', 'lavender', 'mint', 'peach', 'cloud'
  ]);
  const preferences = await fetchUserPreferences();
  return THEME_IDS.has(preferences.theme as ThemeId) ? (preferences.theme as ThemeId) : null;
}

export async function saveUserTheme(theme: ThemeId): Promise<void> {
  await saveUserPreferences({ theme, timezone: getCurrentUserTimeZone() });
}
