import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuthSession, readAuthSession } from '$lib/auth/session';
import { authenticateTelegramMiniApp } from '$lib/telegram/session';

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
});
