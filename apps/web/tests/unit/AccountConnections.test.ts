import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountConnections from '$lib/components/AccountConnections.svelte';

const { getAccountConnections, telegramMiniAppUrl, startTelegramLink, open } = vi.hoisted(() => ({
  getAccountConnections: vi.fn(),
  telegramMiniAppUrl: vi.fn(),
  startTelegramLink: vi.fn(),
  open: vi.fn()
}));

vi.mock('$lib/api/accountLinks', () => ({
  AccountLinkRequestError: class AccountLinkRequestError extends Error {},
  cancelTelegramLink: vi.fn(),
  confirmTelegramLink: vi.fn(),
  detachAccountConnection: vi.fn(),
  getAccountConnections,
  getTelegramLinkStatus: vi.fn(),
  startTelegramLink,
  telegramMiniAppUrl
}));

vi.mock('$lib/telegram/pendingLink', () => ({
  clearPendingTelegramLink: vi.fn(),
  readPendingTelegramLink: vi.fn(() => null),
  savePendingTelegramLink: vi.fn()
}));

describe('AccountConnections', () => {
  beforeEach(() => {
    getAccountConnections.mockResolvedValue({ connections: [
      { provider: 'GOOGLE', connected: true, displayName: 'person@example.com' },
      { provider: 'TELEGRAM', connected: false, displayName: null }
    ] });
    telegramMiniAppUrl.mockImplementation((token: string) => `https://t.me/HabbitRunnerBot?startapp=${token}`);
    startTelegramLink.mockResolvedValue({ token: 'pairing-token' });
    vi.stubGlobal('open', open);
    vi.spyOn(window, 'open').mockImplementation(open);
    open.mockReset();
  });

  it('renders the linked Telegram identity state and starts linking in a new window', async () => {
    const user = userEvent.setup();
    render(AccountConnections);

    expect(await screen.findByText('Not connected')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Link Telegram' }));

    await waitFor(() => expect(open).toHaveBeenCalledWith(
      'https://t.me/HabbitRunnerBot?startapp=pairing-token',
      '_blank',
      'noopener,noreferrer'
    ));
  });
});
