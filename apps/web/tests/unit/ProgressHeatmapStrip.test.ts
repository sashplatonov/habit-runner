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
});
