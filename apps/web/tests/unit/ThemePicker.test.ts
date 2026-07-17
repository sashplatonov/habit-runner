import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ThemePicker from '$lib/components/ThemePicker.svelte';

describe('ThemePicker', () => {
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
});
