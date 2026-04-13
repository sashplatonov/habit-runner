import { DEFAULT_TIMEZONE, normalizeTimeZone } from '@habbit-runner/shared';

const STORAGE_KEY = 'habit-user-timezone';

function readStoredUserTimeZone(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getBrowserTimeZone(): string {
  if (typeof Intl === 'undefined') {
    return DEFAULT_TIMEZONE;
  }

  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return normalizeTimeZone(resolved, DEFAULT_TIMEZONE);
}

let currentUserTimeZone = normalizeTimeZone(readStoredUserTimeZone(), getBrowserTimeZone());

export function getCurrentUserTimeZone(): string {
  return currentUserTimeZone;
}

export function setCurrentUserTimeZone(value?: string | null): string {
  const nextValue = normalizeTimeZone(value ?? null, getBrowserTimeZone());
  currentUserTimeZone = nextValue;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextValue);
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  }

  return nextValue;
}

export function clearCurrentUserTimeZone(): void {
  currentUserTimeZone = getBrowserTimeZone();

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep the in-memory fallback.
    }
  }
}
