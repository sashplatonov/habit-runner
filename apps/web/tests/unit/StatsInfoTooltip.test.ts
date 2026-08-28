import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import StatsInfoTooltip from '$lib/components/stats/StatsInfoTooltip.svelte';

describe('StatsInfoTooltip', () => {
  it('opens a compact tooltip and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(StatsInfoTooltip, { props: { label: 'History', content: 'Twelve weeks of scheduled opportunities.' } });

    const trigger = screen.getByRole('button', { name: 'More information: History' });
    await user.click(trigger);
    expect(screen.getByRole('tooltip').textContent).toContain('Twelve weeks of scheduled opportunities.');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
