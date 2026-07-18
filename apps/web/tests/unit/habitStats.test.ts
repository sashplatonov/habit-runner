import { test, expect } from 'vitest';
import {
  formatDate,
  countCompletedDays
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

test('countCompletedDays counts only truthy values', () => {
  const completions: Record<string, number> = {
    '2026-03-01T00:00:00Z': 1,
    '2026-03-02T00:00:00Z': 0,
    '2026-03-03T00:00:00Z': 2
  };
  expect(countCompletedDays(completions)).toBe(2);
});
