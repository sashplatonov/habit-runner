import { afterEach, describe, expect, it, vi } from 'vitest';
const { mockAuthenticatedFetch } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn()
}));

vi.mock('$lib/auth/session', () => ({
  authenticatedFetch: mockAuthenticatedFetch
}));

import { startTelegramLink, telegramMiniAppUrl } from '$lib/api/accountLinks';

describe('account links', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockAuthenticatedFetch.mockReset();
  });

  it('builds a Telegram deep link for the configured bot', () => {
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '@HabbitRunnerBot');

    expect(telegramMiniAppUrl('pairing-token')).toBe('https://t.me/HabbitRunnerBot?startapp=pairing-token');
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

    await expect(startTelegramLink()).rejects.toThrow(
      'Account linking is temporarily unavailable (reference: trace-123)'
    );
  });
});
