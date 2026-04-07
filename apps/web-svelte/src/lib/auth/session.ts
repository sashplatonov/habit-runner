import { API_BASE_URL } from '$lib/core/config';

const AUTH_SESSION_KEY = 'habbitRunner.auth.session';
const EXPIRY_SKEW_SECONDS = 30;
export const AUTH_SESSION_CLEARED_EVENT = 'habbitRunner.auth.session-cleared';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  email?: string;
}

interface AccessTokenPayload {
  sub?: string;
}

function toSession(payload: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}): AuthSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
    expiresAt: Date.now() + payload.expiresIn * 1000,
    email: payload.email
  };
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) { return null; }
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(payload: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}): AuthSession {
  const session = toSession(payload);
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
}

function isTokenExpiring(session: AuthSession): boolean {
  return Date.now() >= session.expiresAt - EXPIRY_SKEW_SECONDS * 1000;
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });

  if (!response.ok) {
    throw new Error('Unable to refresh authentication token');
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };

  return saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    email: session.email
  });
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = readAuthSession();
  if (!session) { return null; }

  if (!isTokenExpiring(session)) {
    return session.accessToken;
  }

  try {
    const refreshed = await refreshSession(session);
    return refreshed.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function parseOAuthCallbackSession(url: URL): AuthSession | null {
  const accessToken = url.searchParams.get('accessToken');
  const refreshToken = url.searchParams.get('refreshToken');
  const expiresInRaw = url.searchParams.get('expiresIn');
  const email = url.searchParams.get('email') ?? undefined;
  const expiresIn = Number(expiresInRaw);

  if (!accessToken || !refreshToken || !Number.isFinite(expiresIn)) {
    return null;
  }

  return saveAuthSession({ accessToken, refreshToken, expiresIn, email });
}

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

export function getSessionUserId(session: AuthSession | null): string | null {
  if (!session?.accessToken) { return null; }
  const segments = session.accessToken.split('.');
  if (segments.length < 2) { return null; }
  const payloadRaw = decodeBase64Url(segments[1]);
  if (!payloadRaw) { return null; }

  try {
    const payload = JSON.parse(payloadRaw) as AccessTokenPayload;
    return payload.sub?.trim() ?? null;
  } catch {
    return null;
  }
}
