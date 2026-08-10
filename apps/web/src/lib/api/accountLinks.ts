import { authenticatedFetch } from '@/lib/auth/session';

export type AccountLinkStatus = 'PENDING' | 'AWAITING_OWNER_CONFIRMATION' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(`/api${path}`, init);
  if (!response.ok) { throw new Error(`Account linking request failed: ${response.status}`); }
  if (response.status === 204) { return undefined as T; }
  return await response.json() as T;
}

export function startTelegramLink(): Promise<{ token: string }> {
  return request('/auth/link/telegram/start', { method: 'POST' });
}

export function getTelegramConnection(): Promise<{ connected: boolean }> {
  return request('/auth/link/telegram/connection');
}

export function getTelegramLinkStatus(token: string): Promise<{ status: AccountLinkStatus }> {
  return request(`/auth/link/telegram/status?token=${encodeURIComponent(token)}`);
}

export function confirmTelegramLink(token: string): Promise<void> {
  return request('/auth/link/telegram/confirm', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
}

export function cancelTelegramLink(token: string): Promise<void> {
  return request(`/auth/link/telegram?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
}

export function telegramMiniAppUrl(token: string): string | null {
  const configuredUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
  const username = configuredUsername?.trim().replace(/^@/, '');
  if (!username || !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) {
    return null;
  }
  return `https://t.me/${username}?startapp=${encodeURIComponent(token)}`;
}
