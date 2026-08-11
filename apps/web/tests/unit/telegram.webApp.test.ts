import { beforeEach, describe, expect, it, vi } from 'vitest';
import { telegramStartParam, type TelegramWebAppAdapter } from '$lib/telegram/webApp';

function adapter(initData = 'signed-init-data'): TelegramWebAppAdapter {
  return {
    initData,
    initDataUnsafe: {},
    themeParams: { bg_color: '#102030', text_color: '#f8fafc' },
    ready: vi.fn(),
    expand: vi.fn(),
    close: vi.fn()
  };
}

describe('Telegram Web App SDK loader', () => {
  beforeEach(() => {
    vi.resetModules();
    document.getElementById('telegram-web-app-sdk')?.remove();
    delete window.Telegram;
  });

  it('returns an existing Web App and applies its theme', async () => {
    const webApp = adapter();
    window.Telegram = { WebApp: webApp };
    const { loadTelegramWebApp } = await import('$lib/telegram/webApp');

    await expect(loadTelegramWebApp()).resolves.toBe(webApp);
    expect(webApp.ready).toHaveBeenCalledOnce();
    expect(webApp.expand).toHaveBeenCalledOnce();
    expect(document.documentElement.style.getPropertyValue('--telegram-bg-color')).toBe('#102030');
  });

  it('loads the SDK script and exposes the initialized Web App', async () => {
    const { loadTelegramWebApp } = await import('$lib/telegram/webApp');
    const loading = loadTelegramWebApp();
    const script = document.getElementById('telegram-web-app-sdk');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('data-telegram-sdk-state')).toBe('loading');

    const webApp = adapter();
    window.Telegram = { WebApp: webApp };
    script?.dispatchEvent(new Event('load'));

    await expect(loading).resolves.toBe(webApp);
    expect(script?.getAttribute('data-telegram-sdk-state')).toBe('loaded');
    expect(webApp.ready).toHaveBeenCalledOnce();
    expect(webApp.expand).toHaveBeenCalledOnce();
    expect(document.documentElement.style.getPropertyValue('--telegram-bg-color')).toBe('#102030');
  });

  it('removes a failed script so a later retry can load the SDK again', async () => {
    const { loadTelegramWebApp } = await import('$lib/telegram/webApp');
    const firstAttempt = loadTelegramWebApp();
    const failedScript = document.getElementById('telegram-web-app-sdk');
    failedScript?.dispatchEvent(new Event('error'));
    await expect(firstAttempt).rejects.toThrow('Telegram SDK failed to load');

    const secondAttempt = loadTelegramWebApp();
    const retryScript = document.getElementById('telegram-web-app-sdk');
    expect(retryScript).not.toBe(failedScript);
    const webApp = adapter();
    window.Telegram = { WebApp: webApp };
    retryScript?.dispatchEvent(new Event('load'));

    await expect(secondAttempt).resolves.toBe(webApp);
  });

  it('reads a direct-link pairing token from Telegram init data', () => {
    const webApp = adapter();
    webApp.initDataUnsafe = { start_param: 'pairing-token' };

    expect(telegramStartParam(webApp)).toBe('pairing-token');
  });

  it('uses Telegram query fallback when init data does not include the start parameter', () => {
    window.history.replaceState({}, '', '/?tgWebAppStartParam=pairing-token');

    expect(telegramStartParam(adapter())).toBe('pairing-token');
  });
});
