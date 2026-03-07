import { API_BASE_URL } from '@/lib/core/config';
import { getValidAccessToken } from '@/lib/auth/session';
import type { ThemeId } from '@/hooks/useTheme';

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

export async function fetchUserTheme(): Promise<ThemeId | null> {
  const response = await fetch(
    `${API_BASE_URL}/auth/theme`,
    await withAuthHeaders({ method: 'GET' })
  );

  if (!response.ok) {
    throw new Error(`Theme fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as { theme: ThemeId | null };
  return payload.theme ?? null;
}

export async function saveUserTheme(theme: ThemeId): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/auth/theme`,
    await withAuthHeaders({
      method: 'PUT',
      body: JSON.stringify({ theme })
    })
  );

  if (!response.ok) {
    throw new Error(`Theme save failed: ${response.status}`);
  }
}
