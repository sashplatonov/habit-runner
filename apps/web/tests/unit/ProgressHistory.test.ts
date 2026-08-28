import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressHistory from '$lib/components/stats/ProgressHistory.svelte';
import type { HistoryDay } from '$lib/stats/modernStats';

const historyDays: HistoryDay[] = [
  { calendarDate: '2026-08-27', scheduledDays: 1, completedDays: 1, completionRate: 100 },
  { calendarDate: '2026-08-28', scheduledDays: 1, completedDays: 0, completionRate: 0 }
];

describe('ProgressHistory', () => {
  it('keeps a full 12 by 7 history matrix when recorded history is shorter', () => {
    render(ProgressHistory, {
      props: { historyDays, currentWeek: historyDays, currentWeekRate: 50 }
    });

    const history = screen.getByRole('list', { name: '12-week completion history' });
    expect(history.querySelectorAll('[role="listitem"]')).toHaveLength(84);
    expect(history.querySelector('[aria-label="2026-06-06: not scheduled"]')).toBeTruthy();
    expect(history.querySelector('[aria-label="2026-08-28: missed"]')).toBeTruthy();
  });
});
