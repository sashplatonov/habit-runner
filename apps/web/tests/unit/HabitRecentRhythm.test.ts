import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import HabitRecentRhythm from '$lib/components/habits/HabitRecentRhythm.svelte';
import type { HabitDetailRhythmCell } from '$lib/habits/habitDetailViewModel';

const cells: HabitDetailRhythmCell[] = [
  { dateKey: '2026-07-16', label: 'Jul 16', shortLabel: '16', state: 'missed', count: 0, isToday: false },
  { dateKey: '2026-07-17', label: 'Jul 17', shortLabel: '17', state: 'completed', count: 1, isToday: true },
  { dateKey: '2026-07-18', label: 'Jul 18', shortLabel: '18', state: 'future', count: 0, isToday: false }
];

describe('HabitRecentRhythm', () => {
  it('explains and labels past, current, and upcoming day states', () => {
    render(HabitRecentRhythm, { cells });

    expect(screen.getByRole('heading', { name: 'Your 28-day rhythm' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Done');
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Missed');
    expect(screen.getByRole('list', { name: 'Day status legend' }).textContent).toContain('Upcoming');
    expect(screen.getByRole('listitem', { name: 'Jul 16: Missed' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Jul 17: Done, today' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Jul 18: Upcoming' })).toBeTruthy();
  });
});
