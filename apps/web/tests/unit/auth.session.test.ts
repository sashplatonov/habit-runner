import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_SESSION_CLEARED_EVENT,
  authenticatedFetch,
  clearAuthSession,
  readAuthSession,
  saveAuthSession
} from '$lib/auth/session';

describe('authenticatedFetch', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value)
    };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    document.cookie = 'habbit_runner_csrf_token=csrf-token; path=/';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares one refresh request across concurrent authentication failures', async () => {
    const protectedAttempts = new Map<string, number>();
    let refreshAttempts = 0;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        return new Response(JSON.stringify({
          userId: 'user-1',
          email: 'user@example.test'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const attempt = (protectedAttempts.get(url) ?? 0) + 1;
      protectedAttempts.set(url, attempt);
      return new Response(null, { status: attempt === 1 ? 403 : 200 });
    }));

    const [habitsResponse, checkinsResponse] = await Promise.all([
      authenticatedFetch('/api/habits'),
      authenticatedFetch('/api/checkins')
    ]);

    expect(habitsResponse.status).toBe(200);
    expect(checkinsResponse.status).toBe(200);
    expect(refreshAttempts).toBe(1);
    expect(protectedAttempts.get('/api/habits')).toBe(2);
    expect(protectedAttempts.get('/api/checkins')).toBe(2);
  });

  it('does not restore a session cleared while refresh is in flight', async () => {
    saveAuthSession({ userId: 'user-1', email: 'user@example.test' });
    const onSessionCleared = vi.fn();
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/refresh')) {
        clearAuthSession();
        return new Response(JSON.stringify({
          userId: 'user-1',
          email: 'user@example.test'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(null, { status: 403 });
    }));

    try {
      const response = await authenticatedFetch('/api/habits');

      expect(response.status).toBe(403);
      expect(readAuthSession()).toBeNull();
      expect(onSessionCleared).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    }
  });

  it('allows a later request to refresh after an earlier refresh fails', async () => {
    let protectedAttempts = 0;
    let refreshAttempts = 0;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        if (refreshAttempts === 1) {
          return new Response(null, { status: 403 });
        }
        return new Response(JSON.stringify({
          userId: 'user-1',
          email: 'user@example.test'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      protectedAttempts += 1;
      return new Response(null, { status: protectedAttempts < 3 ? 403 : 200 });
    }));

    const firstResponse = await authenticatedFetch('/api/habits');
    const secondResponse = await authenticatedFetch('/api/habits');

    expect(firstResponse.status).toBe(403);
    expect(secondResponse.status).toBe(200);
    expect(refreshAttempts).toBe(2);
    expect(protectedAttempts).toBe(3);
  });
});
