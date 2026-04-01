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
  expect(value).toBe('2026-03-05T00:00:00Z');
});

test('formatDate follows the provided timezone', () => {
  const instant = new Date('2026-03-05T01:30:00.000Z');

  expect(formatDate(instant, 'America/Los_Angeles')).toBe('2026-03-04T00:00:00Z');
  expect(formatDate(instant, 'Europe/Belgrade')).toBe('2026-03-05T00:00:00Z');
});

test('calculateStreak handles current and longest streaks', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-06T00:00:00Z': 1,
    '2026-03-05T00:00:00Z': 1,
    '2026-03-04T00:00:00Z': 1,
    '2026-03-02T00:00:00Z': 1,
    '2026-03-01T00:00:00Z': 1
  };

  const result = calculateStreak(completions, referenceDate);
  expect(result).toEqual({ current: 3, longest: 3 });
});

test('calculateStreak keeps current streak at zero when today is incomplete', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-05T00:00:00Z': 1,
    '2026-03-04T00:00:00Z': 1,
    '2026-03-03T00:00:00Z': 1
  };

  const result = calculateStreak(completions, referenceDate);
  expect(result).toEqual({ current: 0, longest: 3 });
});

test('countCompletedDays counts only truthy values', () => {
  const completions: Record<string, number> = {
    '2026-03-01T00:00:00Z': 1,
    '2026-03-02T00:00:00Z': 0,
    '2026-03-03T00:00:00Z': 2
  };
  expect(countCompletedDays(completions)).toBe(2);
});

test('buildWeeklyCompletionData aggregates days by week window', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-06T00:00:00Z': 1,
    '2026-03-05T00:00:00Z': 1,
    '2026-03-02T00:00:00Z': 1,
    '2026-02-26T00:00:00Z': 1
  };
  const result = buildWeeklyCompletionData(completions, 2, referenceDate);

  expect(result.length).toBe(2);
  expect(result[0].count).toBe(1);
  expect(result[1].count).toBe(3);
});

test('buildMonthlyCompletionRates returns rounded percentage', () => {
  const referenceDate = new Date('2026-03-15T08:00:00.000Z');
  const completions: Record<string, number> = {
    '2026-03-01T00:00:00Z': 1,
    '2026-03-03T00:00:00Z': 1,
    '2026-03-04T00:00:00Z': 1,
    '2026-03-08T00:00:00Z': 1,
    '2026-03-14T00:00:00Z': 1,
    '2026-02-01T00:00:00Z': 1,
    '2026-02-03T00:00:00Z': 1,
    '2026-02-05T00:00:00Z': 1
  };
  const result = buildMonthlyCompletionRates(completions, 2, referenceDate);

  expect(result).toEqual([
    { month: 'Feb', rate: 11 },
    { month: 'Mar', rate: 33 }
  ]);
});
