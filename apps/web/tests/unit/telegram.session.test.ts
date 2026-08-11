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
          initDataUnsafe: {},
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
      JSON.stringify({ userId: 'user-42', email: null, existingAccount: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    const session = await authenticateTelegramMiniApp();

    expect(session.userId).toBe('user-42');
    expect(session.existingAccount).toBe(true);
    expect(readAuthSession()?.userId).toBe('user-42');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/telegram/session'),
      expect.objectContaining({
        body: JSON.stringify({ initData: 'signed-init-data' }),
        credentials: 'include',
        headers: expect.any(Headers)
      })
    );
  });

  it('sends the current CSRF cookie when a browser session already exists', async () => {
    document.cookie = 'habbit_runner_csrf_token=csrf-telegram';
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ userId: 'telegram-user', email: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    await authenticateTelegramMiniApp();

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get('X-CSRF-Token')).toBe('csrf-telegram');
  });

  it('submits a startapp pairing token only after Telegram authentication', async () => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      throw new Error('Telegram Web App test adapter is missing');
    }
    webApp.initDataUnsafe = { start_param: 'pairing-token' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ userId: 'web-owner', email: 'owner@example.test' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    await completeTelegramPairing(webApp);

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/link/telegram/complete', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'pairing-token', initData: 'signed-init-data' }),
      credentials: 'include'
    }));
    expect(readAuthSession()).toEqual({ userId: 'web-owner', email: 'owner@example.test' });
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

  it('surfaces the pairing API detail when completion is rejected', async () => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      throw new Error('Telegram Web App test adapter is missing');
    }
    webApp.initDataUnsafe = { start_param: 'pairing-token' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: 'Invalid or expired account link challenge'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(completeTelegramPairing(webApp)).rejects.toThrow(
      'Telegram account linking failed: Invalid or expired account link challenge'
    );
  });
});
