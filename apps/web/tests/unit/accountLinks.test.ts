import { afterEach, describe, expect, it, vi } from 'vitest';
const { mockAuthenticatedFetch } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn()
}));

vi.mock('$lib/auth/session', () => ({
  authenticatedFetch: mockAuthenticatedFetch
}));

import { detachAccountConnection, getAccountConnections, startTelegramLink, telegramMiniAppUrl } from '$lib/api/accountLinks';
import type { AccountLinkRequestError } from '$lib/api/accountLinks';

describe('account links', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockAuthenticatedFetch.mockReset();
  });

  it('builds a Telegram deep link for the configured bot', () => {
  vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '@HabitRunnerBot');

  expect(telegramMiniAppUrl('pairing-token')).toBe('https://t.me/HabitRunnerBot?startapp=pairing-token');
  });

  it('requires a configured Telegram bot username instead of opening the website outside Telegram', () => {
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '');

    expect(telegramMiniAppUrl('pairing-token')).toBeNull();
  });

  it('exposes the API rejection detail and trace reference when creating a Telegram link fails', async () => {
    mockAuthenticatedFetch.mockResolvedValue(new Response(JSON.stringify({
      detail: 'Account linking is temporarily unavailable'
    }), {
      status: 400,
      headers: { 'X-Trace-Id': 'trace-123' }
    }));

    await expect(startTelegramLink()).rejects.toMatchObject({
      message: 'Account linking is temporarily unavailable (reference: trace-123)',
      name: 'AccountLinkRequestError',
      status: 400
    } satisfies Partial<AccountLinkRequestError>);
  });

  it('loads consolidated connections and detaches a selected provider', async () => {
    mockAuthenticatedFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ connections: [
        { provider: 'TELEGRAM', connected: true, displayName: '@alice' }
      ] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(getAccountConnections()).resolves.toMatchObject({
      connections: [{ provider: 'TELEGRAM', connected: true, displayName: '@alice' }]
    });
    await expect(detachAccountConnection('TELEGRAM')).resolves.toBeUndefined();
    expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith('/api/auth/link/connections/telegram', expect.objectContaining({ method: 'DELETE' }));
  });
});
