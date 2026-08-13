import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountConnections from '$lib/components/AccountConnections.svelte';

const { getAccountConnections, telegramMiniAppUrl, startTelegramLink, open, popup } = vi.hoisted(() => ({
  getAccountConnections: vi.fn(),
  telegramMiniAppUrl: vi.fn(),
  startTelegramLink: vi.fn(),
  open: vi.fn(),
  popup: { close: vi.fn(), location: { replace: vi.fn() }, opener: null as Window | null }
}));

vi.mock('$lib/api/accountLinks', () => ({
  detachAccountConnection: vi.fn(),
  getAccountConnections,
  getTelegramLinkStatus: vi.fn(),
  startTelegramLink,
  telegramMiniAppUrl
}));

describe('AccountConnections', () => {
  beforeEach(() => {
    getAccountConnections.mockResolvedValue({ connections: [
      { provider: 'GOOGLE', connected: true, displayName: 'person@example.com' },
      { provider: 'TELEGRAM', connected: false, displayName: null }
    ] });
    telegramMiniAppUrl.mockImplementation((token?: string) => token
      ? `https://t.me/habit_runner_bot?startapp=${token}`
      : 'https://t.me/habit_runner_bot?startapp');
    startTelegramLink.mockResolvedValue({ token: 'pairing-token' });
    open.mockReturnValue(popup);
    vi.stubGlobal('open', open);
    vi.spyOn(window, 'open').mockImplementation(open);
    open.mockReset();
    open.mockReturnValue(popup);
    popup.close.mockReset();
    popup.location.replace.mockReset();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      }
    });
  });

  it('renders the linked Telegram identity state and starts linking in a new window', async () => {
    const user = userEvent.setup();
    render(AccountConnections);

    expect(await screen.findByText('Not connected')).toBeTruthy();
    expect(screen.queryByText('Open Telegram to continue')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Link Telegram' }));

    expect(open).toHaveBeenCalledWith('', '_blank');
    await waitFor(() => expect(popup.location.replace).toHaveBeenCalledWith(
      'https://t.me/habit_runner_bot?startapp=pairing-token',
    ));
    expect(popup.opener).toBeNull();
  });

  it('opens provider detachment in a native modal dialog', async () => {
    const user = userEvent.setup();
    getAccountConnections.mockResolvedValue({ connections: [
      { provider: 'GOOGLE', connected: true, displayName: 'person@example.com' },
      { provider: 'TELEGRAM', connected: true, displayName: '@person' }
    ] });
    render(AccountConnections);

    await screen.findByText('person@example.com');
    await user.click(screen.getAllByRole('button', { name: 'Unlink' })[0]);

    expect(screen.getByRole('dialog').getAttribute('open')).not.toBeNull();
    expect(screen.getByText('Unlink Google/email?')).toBeTruthy();
  });

  it('shows a small Mini App link for an already linked Telegram account', async () => {
    getAccountConnections.mockResolvedValue({ connections: [
      { provider: 'GOOGLE', connected: true, displayName: 'person@example.com' },
      { provider: 'TELEGRAM', connected: true, displayName: '@person' }
    ] });
    render(AccountConnections);

    const link = await screen.findByRole('link', { name: 'Open Mini App' });
    expect(link.getAttribute('href')).toBe('https://t.me/habit_runner_bot?startapp');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('does not offer unlink when Google/email is the only sign-in method', async () => {
    render(AccountConnections);

    await screen.findByText('person@example.com');
    expect(screen.queryByRole('button', { name: 'Unlink' })).toBeNull();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Required').getAttribute('title')).toBe('Required while Telegram is unlinked');
  });

  it('does not offer unlink when Telegram is the only sign-in method', async () => {
    getAccountConnections.mockResolvedValue({ connections: [
      { provider: 'GOOGLE', connected: false, displayName: null },
      { provider: 'TELEGRAM', connected: true, displayName: '@person' }
    ] });
    render(AccountConnections);

    await screen.findByText('@person');
    expect(screen.queryByRole('button', { name: 'Unlink' })).toBeNull();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Required').getAttribute('title')).toBe('Required while Google/email is unlinked');
  });

  it('keeps provider status available to assistive technology while loading', async () => {
    let resolveConnections: ((value: { connections: never[] }) => void) | undefined;
    getAccountConnections.mockReturnValue(new Promise((resolve) => { resolveConnections = resolve; }));
    render(AccountConnections);

    expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('true');
    resolveConnections?.({ connections: [] });
    await waitFor(() => expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('false'));
  });
});
