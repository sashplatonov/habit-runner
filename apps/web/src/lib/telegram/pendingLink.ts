const PENDING_LINK_STORAGE_KEY = 'habbitRunner.telegram.pending-link';

export function readPendingTelegramLink(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.sessionStorage.getItem(PENDING_LINK_STORAGE_KEY);
}

export function savePendingTelegramLink(token: string): void {
  window.sessionStorage.setItem(PENDING_LINK_STORAGE_KEY, token);
}

export function clearPendingTelegramLink(): void {
  window.sessionStorage.removeItem(PENDING_LINK_STORAGE_KEY);
}
