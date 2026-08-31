import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';

describe('DescriptionTooltip', () => {
  it('exposes an expanded trigger and sanitized dialog content', async () => {
    const user = userEvent.setup();
    render(DescriptionTooltip, {
      props: {
        description: '**Bold** <script>alert(1)</script>',
        triggerLabel: 'Description for Read'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Description for Read' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog', { name: 'Description for Read' });
    expect(dialog.querySelector('strong')).toBeTruthy();
    expect(dialog.querySelector('script')).toBeNull();
    expect(dialog.textContent).not.toContain('Open description');
  });

  it('uses a unique controlled panel id for each tooltip instance', () => {
    render(DescriptionTooltip, {
      props: {
        description: 'Same description',
        triggerLabel: 'First description'
      }
    });
    render(DescriptionTooltip, {
      props: {
        description: 'Same description',
        triggerLabel: 'Second description'
      }
    });

    const firstId = screen.getByRole('button', { name: 'First description' }).getAttribute('aria-controls');
    const secondId = screen.getByRole('button', { name: 'Second description' }).getAttribute('aria-controls');
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });

  it('keeps the trigger click from reaching a clickable habit card', async () => {
    const user = userEvent.setup();
    render(DescriptionTooltip, { props: { description: 'Habit details' } });
    const trigger = screen.getByRole('button', { name: 'Description' });
    let parentClicked = false;
    const parentClickHandler = () => {
      parentClicked = true;
    };
    document.body.addEventListener('click', parentClickHandler);

    await user.click(trigger);

    document.body.removeEventListener('click', parentClickHandler);
    expect(parentClicked).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Description' })).toBeTruthy();
  });
});
