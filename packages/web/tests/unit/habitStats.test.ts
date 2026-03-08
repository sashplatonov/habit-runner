import { test, expect } from 'vitest';
import {
  formatDate,
  calculateStreak,
  countCompletedDays,
  buildWeeklyCompletionData,
  buildMonthlyCompletionRates
} from '../../src/lib/habits/habitStats.js';

test('formatDate returns YYYY-MM-DD', () => {
  const value = formatDate(new Date('2026-03-05T12:22:00.000Z'));
  expect(value).toBe('2026-03-05');
});

test('calculateStreak handles current and longest streaks', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-06': 1,
    '2026-03-05': 1,
    '2026-03-04': 1,
    '2026-03-02': 1,
    '2026-03-01': 1
  };

  const result = calculateStreak(completions, referenceDate);
  expect(result).toEqual({ current: 3, longest: 3 });
});

test('calculateStreak keeps current streak at zero when today is incomplete', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-05': 1,
    '2026-03-04': 1,
    '2026-03-03': 1
  };

  const result = calculateStreak(completions, referenceDate);
  expect(result).toEqual({ current: 0, longest: 3 });
});

test('countCompletedDays counts only truthy values', () => {
  const completions: Record<string, number> = {
    '2026-03-01': 1,
    '2026-03-02': 0,
    '2026-03-03': 2
  };
  expect(countCompletedDays(completions)).toBe(2);
});

test('buildWeeklyCompletionData aggregates days by week window', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-06': 1,
    '2026-03-05': 1,
    '2026-03-02': 1,
    '2026-02-26': 1
  };
  const result = buildWeeklyCompletionData(completions, 2, referenceDate);

  expect(result.length).toBe(2);
  expect(result[0].count).toBe(1);
  expect(result[1].count).toBe(3);
});

test('buildMonthlyCompletionRates returns rounded percentage', () => {
  const referenceDate = new Date('2026-03-15T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-01': 1,
    '2026-03-03': 1,
    '2026-03-04': 1,
    '2026-03-08': 1,
    '2026-03-14': 1,
    '2026-02-01': 1,
    '2026-02-03': 1,
    '2026-02-05': 1
  };
  const result = buildMonthlyCompletionRates(completions, 2, referenceDate);

  expect(result).toEqual([
    { month: 'Feb', rate: 11 },
    { month: 'Mar', rate: 33 }
  ]);
});
