import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemePicker from '$lib/components/ThemePicker.svelte';
import { themeStore } from '$lib/stores/theme';

describe('ThemePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  });

  it('renders the full catalog and exposes the selected theme', () => {
    render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });

    const themeButtons = screen.getAllByRole('button', { name: /Switch to .+ theme/ });
    const cloudButton = screen.getByRole('button', { name: 'Switch to Cloud theme' });

    expect(themeButtons).toHaveLength(10);
    expect(cloudButton.getAttribute('aria-pressed')).toBe('true');
    expect(cloudButton.querySelector('svg')).toBeTruthy();
  });

  it('emits the chosen theme and closes through the shared callback', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const onChoose = vi.fn();
    render(ThemePicker, { theme: 'cloud', onThemeChange, onChoose });

    await user.click(screen.getByRole('button', { name: 'Switch to Graphite Pro theme' }));

    expect(onThemeChange).toHaveBeenCalledWith('graphite');
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('waits for the usage preference save before changing the theme', async () => {
    const user = userEvent.setup();
    let resolveUsageSave: (() => void) | undefined;
    const recordUsage = vi.spyOn(themeStore, 'recordThemeSelection').mockImplementation(
      () => new Promise<void>((resolve) => { resolveUsageSave = resolve; })
    );
    const onThemeChange = vi.fn();
    render(ThemePicker, { theme: 'cloud', onThemeChange });

    const click = user.click(screen.getByRole('button', { name: 'Switch to Graphite Pro theme' }));
    await waitFor(() => expect(recordUsage).toHaveBeenCalledWith('graphite'));
    expect(onThemeChange).not.toHaveBeenCalled();

    resolveUsageSave?.();
    await click;
    await waitFor(() => expect(onThemeChange).toHaveBeenCalledWith('graphite'));
  });

  it('moves the most frequently selected themes to the top of their group', async () => {
    const user = userEvent.setup();
    const { unmount } = render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'Switch to Peach Paper theme' }));
    await user.click(screen.getByRole('button', { name: 'Switch to Peach Paper theme' }));
    unmount();

    render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });
    const themeButtons = screen.getAllByRole('button', { name: /Switch to .+ theme/ });

    expect(themeButtons[0]?.getAttribute('aria-label')).toBe('Switch to Peach Paper theme');
  });

  it('keeps the selected indicator outside the flexible content column', () => {
    render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });

    const cloudButton = screen.getByRole('button', { name: 'Switch to Cloud theme' });
    const contentColumn = cloudButton.querySelector('.min-w-0');

    expect(contentColumn).toBeTruthy();
    expect(contentColumn?.textContent).toContain('Cloud');
    expect(contentColumn?.nextElementSibling?.tagName).toBe('svg');
  });
});
