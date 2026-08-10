import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingTelegramLink, readPendingTelegramLink, savePendingTelegramLink } from '$lib/telegram/pendingLink';

describe('pending Telegram link', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('keeps an unfinished pairing challenge across a page reload in the same tab', () => {
    savePendingTelegramLink('pairing-token');

    expect(readPendingTelegramLink()).toBe('pairing-token');

    clearPendingTelegramLink();
    expect(readPendingTelegramLink()).toBeNull();
  });
});
