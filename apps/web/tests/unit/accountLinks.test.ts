import { afterEach, describe, expect, it, vi } from 'vitest';
import { telegramMiniAppUrl } from '$lib/api/accountLinks';

describe('account links', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds a Telegram deep link for the configured bot', () => {
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '@HabbitRunnerBot');

    expect(telegramMiniAppUrl('pairing-token')).toBe('https://t.me/HabbitRunnerBot?startapp=pairing-token');
  });

  it('requires a configured Telegram bot username instead of opening the website outside Telegram', () => {
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '');

    expect(telegramMiniAppUrl('pairing-token')).toBeNull();
  });
});
