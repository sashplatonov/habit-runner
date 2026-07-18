import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemePicker from '$lib/components/ThemePicker.svelte';

describe('ThemePicker', () => {
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

    expect(themeButtons).toHaveLength(14);
    expect(cloudButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Selected')).toBeTruthy();
  });

  it('emits the chosen theme and closes through the shared callback', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const onChoose = vi.fn();
    render(ThemePicker, { theme: 'cloud', onThemeChange, onChoose });

    await user.click(screen.getByRole('button', { name: 'Switch to Graphite theme' }));

    expect(onThemeChange).toHaveBeenCalledWith('graphite');
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('moves the most frequently selected themes to the top of their group', async () => {
    const user = userEvent.setup();
    const { unmount } = render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'Switch to Sakura theme' }));
    await user.click(screen.getByRole('button', { name: 'Switch to Sakura theme' }));
    unmount();

    render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });
    const themeButtons = screen.getAllByRole('button', { name: /Switch to .+ theme/ });

    expect(themeButtons[0]?.getAttribute('aria-label')).toBe('Switch to Sakura theme');
  });

  it('keeps the selected badge inside the flexible content column', () => {
    render(ThemePicker, { theme: 'cloud', onThemeChange: vi.fn() });

    const selectedBadge = screen.getByText('Selected').parentElement;

    expect(selectedBadge?.parentElement?.className).toContain('min-w-0');
    expect(selectedBadge?.className).toContain('max-w-full');
  });
});
