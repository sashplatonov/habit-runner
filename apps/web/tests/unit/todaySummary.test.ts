import { describe, expect, it } from 'vitest';
import { buildTodaySummary } from '../../src/lib/dashboard/todaySummary';

describe('buildTodaySummary', () => {
  it('returns a hydrating state when dashboard data is still syncing', () => {
    const summary = buildTodaySummary({
      isHydrating: true,
      scheduledCount: 3,
      completedCount: 1,
      bestStreak: 8,
      daysSinceLastCompletion: 1,
      nextHabitName: 'Hydrate',
      nextHabitId: 'habit-1'
    });

    expect(summary.state).toBe('hydrating');
    expect(summary.progressValue).toBe(0);
    expect(summary.nextActionLabel).toBeNull();
  });

  it('returns a comeback state for a fresh restart after a gap', () => {
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 4,
      completedCount: 0,
      bestStreak: 11,
      daysSinceLastCompletion: 4,
      nextHabitName: 'Walk',
      nextHabitId: 'habit-2'
    });

    expect(summary.state).toBe('comeback');
    expect(summary.headline).toContain('Fresh start');
    expect(summary.progressTone).toBe('attention');
    expect(summary.nextActionLabel).toBe('Start with Walk');
  });

  it('returns a one-left state when the last scheduled habit remains', () => {
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 5,
      completedCount: 4,
      bestStreak: 18,
      daysSinceLastCompletion: 0,
      nextHabitName: 'Read',
      nextHabitId: 'habit-3'
    });

    expect(summary.state).toBe('one-left');
    expect(summary.progressTone).toBe('attention');
    expect(summary.nextActionLabel).toBe('Continue with Read');
  });

  it('returns a complete state when today is finished', () => {
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 2,
      completedCount: 2,
      bestStreak: 9,
      daysSinceLastCompletion: 0,
      nextHabitName: 'Anything',
      nextHabitId: 'habit-4'
    });

    expect(summary.state).toBe('complete');
    expect(summary.isComplete).toBe(true);
    expect(summary.nextActionLabel).toBeNull();
    expect(summary.progressValue).toBe(100);
  });

  it('returns a nothing-scheduled state without fake progress', () => {
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 0,
      completedCount: 0,
      bestStreak: 2,
      daysSinceLastCompletion: 0
    });

    expect(summary.state).toBe('nothing-scheduled');
    expect(summary.progressValue).toBe(0);
    expect(summary.message).toContain('planned today');
  });

  it('normalizes inconsistent numeric input for safe presentation', () => {
    const summary = buildTodaySummary({
      isHydrating: false,
      scheduledCount: 2.8,
      completedCount: 7,
      bestStreak: -4,
      daysSinceLastCompletion: -2
    });

    expect(summary.state).toBe('complete');
    expect(summary.progressLabel).toBe('2 of 2 completed');
    expect(summary.metrics).toContainEqual({ label: 'Scheduled', value: '2', tone: 'muted' });
    expect(summary.metrics).toContainEqual({ label: 'Best streak', value: '—', tone: 'progress' });
  });
});
