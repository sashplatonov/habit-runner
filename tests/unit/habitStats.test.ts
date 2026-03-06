import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  formatDate,
  calculateStreak,
  countCompletedDays,
  buildWeeklyCompletionData,
  buildMonthlyCompletionRates
} from '../../src/lib/habits/habitStats.js';

test('formatDate returns YYYY-MM-DD', () => {
  const value = formatDate(new Date('2026-03-05T12:22:00.000Z'));
  assert.equal(value, '2026-03-05');
});

test('calculateStreak handles current and longest streaks', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, boolean> = {
    '2026-03-06': true,
    '2026-03-05': true,
    '2026-03-04': true,
    '2026-03-02': true,
    '2026-03-01': true
  };

  const result = calculateStreak(completions, referenceDate);
  assert.deepEqual(result, { current: 3, longest: 3 });
});

test('calculateStreak keeps current streak at zero when today is incomplete', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, boolean> = {
    '2026-03-05': true,
    '2026-03-04': true,
    '2026-03-03': true
  };

  const result = calculateStreak(completions, referenceDate);
  assert.deepEqual(result, { current: 0, longest: 3 });
});

test('countCompletedDays counts only truthy values', () => {
  const completions: Record<string, boolean> = {
    '2026-03-01': true,
    '2026-03-02': false,
    '2026-03-03': true
  };
  assert.equal(countCompletedDays(completions), 2);
});

test('buildWeeklyCompletionData aggregates days by week window', () => {
  const referenceDate = new Date('2026-03-06T08:00:00.000Z');
  const completions: Record<string, boolean> = {
    '2026-03-06': true,
    '2026-03-05': true,
    '2026-03-02': true,
    '2026-02-26': true
  };
  const result = buildWeeklyCompletionData(completions, 2, referenceDate);

  assert.equal(result.length, 2);
  assert.equal(result[0].count, 1);
  assert.equal(result[1].count, 3);
});

test('buildMonthlyCompletionRates returns rounded percentage', () => {
  const referenceDate = new Date('2026-03-15T08:00:00.000Z');
  const completions: Record<string, boolean> = {
    '2026-03-01': true,
    '2026-03-03': true,
    '2026-03-04': true,
    '2026-03-08': true,
    '2026-03-14': true,
    '2026-02-01': true,
    '2026-02-03': true,
    '2026-02-05': true
  };
  const result = buildMonthlyCompletionRates(completions, 2, referenceDate);

  assert.deepEqual(result, [
    { month: 'Feb', rate: 11 },
    { month: 'Mar', rate: 33 }
  ]);
});
