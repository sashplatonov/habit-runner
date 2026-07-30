import { API_BASE_URL } from '@/lib/core/config';

const AUTH_SESSION_KEY = 'habbitRunner.auth.session';
const CSRF_COOKIE_NAME = 'habbit_runner_csrf_token';
export const AUTH_SESSION_CLEARED_EVENT = 'habbitRunner.auth.session-cleared';

export interface AuthSession {
  userId: string;
  email?: string;
}

let refreshInFlight: Promise<AuthSession> | null = null;
let authSessionRevision = 0;

function toSession(payload: {
  userId: string;
  email?: string;
}): AuthSession {
  return {
    userId: payload.userId,
    email: payload.email
  };
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(payload: {
  userId: string;
  email?: string;
}): AuthSession {
  const session = toSession(payload);
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  authSessionRevision += 1;
  return session;
}

export function clearAuthSession(): void {
  const hadSession = localStorage.getItem(AUTH_SESSION_KEY) !== null;
  localStorage.removeItem(AUTH_SESSION_KEY);
  authSessionRevision += 1;
  if (hadSession) {
    window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const cookies = document.cookie.split(';').map((value) => value.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((value) => value.startsWith(prefix));
  if (!cookie) {
    return null;
  }
  const [, encodedValue = ''] = cookie.split('=', 2);
  return encodedValue ? decodeURIComponent(encodedValue) : null;
}

function addAuthHeaders(headers: Headers, method: string, hasBody: boolean): void {
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (method === 'GET' || method === 'HEAD') {
    return;
  }
  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
}

function normalizeAuthSession(payload: unknown): AuthSession {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid auth session payload');
  }
  const record = payload as Record<string, unknown>;
  const userId = typeof record['userId'] === 'string' ? record['userId'] : null;
  const email = typeof record['email'] === 'string' ? record['email'] : undefined;
  if (!userId) {
    throw new Error('Auth session response did not include a userId');
  }
  return saveAuthSession({ userId, email });
}

async function loadAuthSessionFromServer(): Promise<AuthSession | null> {
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  if (response.status === 403) {
    clearAuthSession();
    return null;
  }
  if (!response.ok) {
    throw new Error(`Auth session fetch failed: ${response.status}`);
  }
  return normalizeAuthSession(await response.json());
}

async function refreshSession(): Promise<AuthSession> {
  const revisionAtStart = authSessionRevision;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const headers = new Headers();
    addAuthHeaders(headers, 'POST', false);
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Unable to refresh authentication token');
    }

    const payload = await response.json();
    if (revisionAtStart !== authSessionRevision) {
      throw new Error('Auth refresh was superseded by a newer session change');
    }
    return normalizeAuthSession(payload);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Auth refresh timed out', { cause: err });
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Auth refresh failed with a non-Error throwable', {
      cause: err
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function refreshSessionOnce(): Promise<AuthSession> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function ensureAuthSession(): Promise<AuthSession | null> {
  try {
    return await loadAuthSessionFromServer();
  } catch {
    return readAuthSession();
  }
}

function shouldRetryWithRefresh(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0];
  return !path.endsWith('/auth/refresh') && !path.endsWith('/auth/logout');
}

export async function authenticatedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const hasBody = init.body !== undefined && init.body !== null;
  const headers = new Headers(init.headers);
  addAuthHeaders(headers, method, hasBody);

  const doFetch = (requestHeaders: Headers): Promise<Response> => {
    return fetch(input, {
      ...init,
      headers: requestHeaders,
      credentials: 'include',
      cache: 'no-store'
    });
  };

  let response = await doFetch(headers);
  if (response.status !== 403 || !shouldRetryWithRefresh(input)) {
    if (response.status === 403) {
      clearAuthSession();
    }
    return response;
  }

  try {
    await refreshSessionOnce();
  } catch {
    clearAuthSession();
    return response;
  }

  const retryHeaders = new Headers(init.headers);
  addAuthHeaders(retryHeaders, method, hasBody);
  response = await doFetch(retryHeaders);
  if (response.status === 403) {
    clearAuthSession();
  }
  return response;
}

export function getSessionUserId(session: AuthSession | null): string | null {
  return session?.userId ?? null;
}
