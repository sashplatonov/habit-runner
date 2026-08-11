import { authenticatedFetch } from '@/lib/auth/session';

export type AccountProvider = 'GOOGLE' | 'TELEGRAM';
export type AccountConnection = {
  provider: AccountProvider;
  connected: boolean;
  displayName: string | null;
};

export class AccountLinkRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AccountLinkRequestError';
  }
}

async function errorMessage(response: Response): Promise<string> {
  let detail: string | null = null;
  try {
    const payload = await response.json() as { detail?: unknown };
    detail = typeof payload.detail === 'string' && payload.detail.trim() ? payload.detail.trim() : null;
  } catch {
    detail = null;
  }
  const traceId = response.headers.get('X-Trace-Id');
  const message = detail ?? `Request failed with status ${response.status}`;
  return traceId ? `${message} (reference: ${traceId})` : message;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(`/api${path}`, init);
  if (!response.ok) { throw new AccountLinkRequestError(await errorMessage(response), response.status); }
  if (response.status === 204) { return undefined as T; }
  return await response.json() as T;
}

export function startTelegramLink(): Promise<{ token: string }> {
  return request('/auth/link/telegram/start', { method: 'POST' });
}

export function getTelegramConnection(): Promise<{ connected: boolean }> {
  return request('/auth/link/telegram/connection');
}

export function getAccountConnections(): Promise<{ connections: AccountConnection[] }> {
  return request('/auth/link/connections');
}

export function detachAccountConnection(provider: AccountProvider): Promise<void> {
  return request(`/auth/link/connections/${provider.toLowerCase()}`, { method: 'DELETE' });
}

export function telegramMiniAppUrl(token: string): string | null {
  const configuredUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
  const username = configuredUsername?.trim().replace(/^@/, '');
  if (!username || !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) {
    return null;
  }
  return `https://t.me/${username}?startapp=${encodeURIComponent(token)}`;
}
