import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';

describe('MiniHeatmap', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the 30 calendar days and applies dailyTarget to completion state', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'));

    const { container } = render(MiniHeatmap, {
      completions: {
        '2026-08-27T00:00:00Z': 1,
        '2026-08-28T00:00:00Z': 2
      },
      dailyTarget: 2,
      color: 'blue'
    });

    const cells = [...container.querySelectorAll<HTMLElement>('[data-date]')];
    expect(cells).toHaveLength(30);
    expect(new Set(cells.map((cell) => cell.dataset.date)).size).toBe(30);
    expect(cells[0]?.dataset.date).toBe('2026-07-30');
    expect(cells.at(-1)?.dataset.date).toBe('2026-08-28');
    expect(cells[0]?.parentElement?.children).toHaveLength(34);
    expect([...cells[0]?.parentElement?.children ?? []].slice(0, 4).every((cell) => !cell.hasAttribute('data-date'))).toBe(true);
    expect(cells.every((cell) => cell.dataset.lookupKey === `${cell.dataset.date}T00:00:00Z`)).toBe(true);
    expect(container.querySelector('[data-date="2026-08-27"]')?.getAttribute('data-completed')).toBe('false');
    expect(container.querySelector('[data-date="2026-08-28"]')?.getAttribute('data-completed')).toBe('true');
  });
});
