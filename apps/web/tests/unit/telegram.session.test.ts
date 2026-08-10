import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuthSession, readAuthSession } from '$lib/auth/session';
import { authenticateTelegramMiniApp, completeTelegramPairing } from '$lib/telegram/session';

describe('Telegram Mini App session', () => {
  beforeEach(() => {
    clearAuthSession();
    Object.defineProperty(window, 'Telegram', {
      configurable: true,
      value: {
        WebApp: {
          initData: 'signed-init-data',
          startParam: null,
          themeParams: { bg_color: '#fff' },
          ready: vi.fn(),
          expand: vi.fn(),
          close: vi.fn()
        }
      }
    });
  });

  it('exchanges raw initData and persists the server session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ userId: 'user-42', email: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    const session = await authenticateTelegramMiniApp();

    expect(session.userId).toBe('user-42');
    expect(readAuthSession()?.userId).toBe('user-42');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/telegram/session'),
      expect.objectContaining({ body: JSON.stringify({ initData: 'signed-init-data' }) })
    );
  });

  it('submits a startapp pairing token only after Telegram authentication', async () => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      throw new Error('Telegram Web App test adapter is missing');
    }
    webApp.startParam = 'pairing-token';
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await completeTelegramPairing(webApp);

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/link/telegram/complete', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'pairing-token', initData: 'signed-init-data' }),
      credentials: 'include'
    }));
  });

  it('explains when the API has no Telegram bot token configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: 'https://habbit-runner.dev/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: 'Telegram authentication is not configured',
      errorCode: 'BAD_REQUEST'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticateTelegramMiniApp()).rejects.toThrow(
      'Telegram sign-in is not configured for this environment.'
    );
  });
});
