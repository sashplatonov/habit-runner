import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';

describe('ChartGuideTooltip', () => {
  it('keeps focus preview non-modal and restores focus after an explicit close', async () => {
    const user = userEvent.setup();
    render(ChartGuideTooltip, {
      props: {
        title: 'History',
        summary: 'Summary',
        focusPoints: ['Point']
      }
    });

    const trigger = screen.getByRole('button', { name: 'Chart guide: History' });
    trigger.focus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole('tooltip', { name: 'History explanation' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'History explanation' })).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'History explanation' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'History explanation' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await Promise.resolve();
    expect(screen.queryByRole('tooltip', { name: 'History explanation' })).toBeNull();
  });
});
