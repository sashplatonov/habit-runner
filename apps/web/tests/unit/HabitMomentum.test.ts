import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import HabitMomentum from '$lib/components/habits/HabitMomentum.svelte';

describe('HabitMomentum', () => {
  it('keeps one current run and one reachable checkpoint visible', () => {
    render(HabitMomentum, {
      currentStreak: 1,
      hasCompletionHistory: true,
      streakLabel: '1 day',
      bestLabel: '4 days best',
      completionRateLabel: '80% completion',
      nextMilestoneLabel: '3-day checkpoint',
      nextMilestoneDays: 2,
      nextMilestoneTarget: 3
    });

    expect(screen.getByText('1 day')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '3-day checkpoint' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Checkpoint progress' }).getAttribute('aria-valuenow')).toBe('33');
    expect(screen.getByText('4 days best')).toBeTruthy();
    expect(screen.getByText('80% completion')).toBeTruthy();
  });

  it('does not fill a new habit with zero-value supporting metrics', () => {
    render(HabitMomentum, {
      currentStreak: 0,
      hasCompletionHistory: false,
      streakLabel: '0 days',
      bestLabel: '0 days best',
      completionRateLabel: '0% completion',
      nextMilestoneLabel: 'First scheduled completion',
      nextMilestoneDays: 1,
      nextMilestoneTarget: 1
    });

    expect(screen.queryByText('0 days best')).toBeNull();
    expect(screen.queryByText('0% completion')).toBeNull();
    expect(screen.getByRole('heading', { name: 'First scheduled completion' })).toBeTruthy();
  });
});
