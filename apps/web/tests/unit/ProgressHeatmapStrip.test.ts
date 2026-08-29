import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressHeatmapStrip from '$lib/components/stats/ProgressHeatmapStrip.svelte';
import type { HabitHeatmapCell } from '$lib/stats/modernStats';

describe('ProgressHeatmapStrip', () => {
  it('renders one accessible cell per supplied day', () => {
    render(ProgressHeatmapStrip, {
      props: {
        cells: Array.from({ length: 7 }, (_, index): HabitHeatmapCell => ({
          calendarDate: `2026-07-0${index + 1}`,
          state: index === 0 ? 'completed' : index === 1 ? 'missed' : 'not scheduled',
          intensity: 0.5
        }))
      }
    });

    expect(screen.getByRole('list').querySelectorAll('[role="listitem"]')).toHaveLength(7);
    expect(screen.getByLabelText('2026-07-01: completed')).toBeTruthy();
    expect(screen.getByLabelText('2026-07-03: not scheduled')).toBeTruthy();
  });

  it('uses a seven-row matrix for a 12-week period', () => {
    render(ProgressHeatmapStrip, {
      props: {
        cells: Array.from({ length: 84 }, (_, index): HabitHeatmapCell => ({
          calendarDate: `2026-07-${String((index % 28) + 1).padStart(2, '0')}`,
          state: 'completed',
          intensity: 1
        }))
      }
    });

    const heatmap = screen.getByRole('list');
    expect(heatmap.className).toContain('grid-rows-7');
    expect(heatmap.getAttribute('style')).toContain('repeat(12, minmax(0, 1fr))');
    expect(heatmap.querySelectorAll('[role="listitem"]')).toHaveLength(84);
  });
});
