import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_SESSION_CLEARED_EVENT,
  authenticatedFetch,
  clearAuthSession,
  readAuthSession,
  saveAuthSession
} from '$lib/auth/session';

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

describe('authenticatedFetch refresh status handling', () => {
  it('refreshes an expired session when the API returns 401', async () => {
    let protectedAttempts = 0;
    let refreshAttempts = 0;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        return new Response(JSON.stringify({ userId: 'user-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      protectedAttempts += 1;
      return new Response(null, { status: protectedAttempts === 1 ? 401 : 200 });
    }));

    const response = await authenticatedFetch('/api/habits');

    expect(response.status).toBe(200);
    expect(refreshAttempts).toBe(1);
    expect(protectedAttempts).toBe(2);
  });
});

describe('authenticatedFetch', () => {
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

  it('recovers when another browser context wins refresh-token rotation', async () => {
    let protectedAttempts = 0;
    let sessionAttempts = 0;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return new Response(null, { status: 409 });
      }
      if (url.endsWith('/auth/session')) {
        sessionAttempts += 1;
        return new Response(JSON.stringify({
          userId: 'user-1',
          email: 'user@example.test'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      protectedAttempts += 1;
      return new Response(null, { status: protectedAttempts === 1 ? 403 : 200 });
    }));

    const response = await authenticatedFetch('/api/habits');

    expect(response.status).toBe(200);
    expect(sessionAttempts).toBe(1);
    expect(readAuthSession()).toEqual({
      userId: 'user-1',
      email: 'user@example.test'
    });
  });

  it('does not refresh when logout with a query string is rejected', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authenticatedFetch('/auth/logout?all=true', { method: 'POST' });

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

});

describe('authenticatedFetch endpoint exclusions', () => {
  it('does not refresh the refresh endpoint after a 401 response', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authenticatedFetch('/api/auth/refresh', { method: 'POST' });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
