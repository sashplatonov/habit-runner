yeimport { test, expect, describe } from 'vitest';
import {
  toCompletionKey,
  calendarDateToCompletionKey,
  completionKeyToCalendarDate,
  normalizeToCompletionKey
} from '../../src/lib/completionKey.js';

// ---------------------------------------------------------------------------
// toCompletionKey
// ---------------------------------------------------------------------------

describe('toCompletionKey', () => {
  test('converts a UTC Date to YYYY-MM-DDT00:00:00Z', () => {
    const date = new Date('2024-06-15T12:30:00.000Z');
    expect(toCompletionKey(date, 'UTC')).toBe('2024-06-15T00:00:00Z');
  });

  test('uses user timezone — date ahead of UTC flips to next calendar day', () => {
    // 2024-06-15T23:00 UTC = 2024-06-16 in UTC+3
    const date = new Date('2024-06-15T23:00:00.000Z');
    expect(toCompletionKey(date, 'Europe/Moscow')).toBe('2024-06-16T00:00:00Z');
  });

  test('uses user timezone — date behind UTC stays on previous calendar day', () => {
    // 2024-06-15T01:30 UTC = 2024-06-14 in UTC-5 (America/New_York during summer)
    const date = new Date('2024-06-15T01:30:00.000Z');
    expect(toCompletionKey(date, 'America/New_York')).toBe('2024-06-14T00:00:00Z');
  });

  test('produced keys are lexicographically sortable', () => {
    const keys = [
      toCompletionKey(new Date('2024-03-01T00:00:00Z'), 'UTC'),
      toCompletionKey(new Date('2024-01-15T00:00:00Z'), 'UTC'),
      toCompletionKey(new Date('2024-12-31T00:00:00Z'), 'UTC')
    ].sort();
    expect(keys).toEqual([
      '2024-01-15T00:00:00Z',
      '2024-03-01T00:00:00Z',
      '2024-12-31T00:00:00Z'
    ]);
  });
});

// ---------------------------------------------------------------------------
// calendarDateToCompletionKey
// ---------------------------------------------------------------------------

describe('calendarDateToCompletionKey', () => {
  test('appends T00:00:00Z to a plain YYYY-MM-DD string', () => {
    expect(calendarDateToCompletionKey('2024-06-15')).toBe('2024-06-15T00:00:00Z');
  });

  test('is the inverse of completionKeyToCalendarDate', () => {
    const calDate = '2024-11-30';
    expect(completionKeyToCalendarDate(calendarDateToCompletionKey(calDate))).toBe(calDate);
  });
});

// ---------------------------------------------------------------------------
// completionKeyToCalendarDate
// ---------------------------------------------------------------------------

describe('completionKeyToCalendarDate', () => {
  test('extracts YYYY-MM-DD from canonical key', () => {
    expect(completionKeyToCalendarDate('2024-06-15T00:00:00Z')).toBe('2024-06-15');
  });

  test('works on already plain YYYY-MM-DD strings', () => {
    expect(completionKeyToCalendarDate('2024-06-15')).toBe('2024-06-15');
  });

  test('works on ISO strings with non-zero time component', () => {
    expect(completionKeyToCalendarDate('2024-06-15T14:32:00.000Z')).toBe('2024-06-15');
  });

  test('produces freeze-day-compatible strings', () => {
    // Freeze days are stored as YYYY-MM-DD — must match exactly
    const key = '2024-06-15T00:00:00Z';
    const freezeKey = completionKeyToCalendarDate(key);
    const freezeDays = ['2024-06-14', '2024-06-15', '2024-06-16'];
    expect(freezeDays.includes(freezeKey)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeToCompletionKey
// ---------------------------------------------------------------------------

describe('normalizeToCompletionKey', () => {
  test('already-canonical key is returned unchanged', () => {
    expect(normalizeToCompletionKey('2024-06-15T00:00:00Z')).toBe('2024-06-15T00:00:00Z');
  });

  test('plain YYYY-MM-DD is upgraded to canonical key', () => {
    expect(normalizeToCompletionKey('2024-06-15')).toBe('2024-06-15T00:00:00Z');
  });

  test('ISO string with non-zero time is normalized to midnight UTC', () => {
    expect(normalizeToCompletionKey('2024-06-15T14:32:00.000Z')).toBe('2024-06-15T00:00:00Z');
  });

  test('is idempotent — normalizing twice gives the same result', () => {
    const raw = '2024-06-15T14:32:00.000Z';
    const once = normalizeToCompletionKey(raw);
    const twice = normalizeToCompletionKey(once);
    expect(once).toBe(twice);
  });
});

// ---------------------------------------------------------------------------
// Cross-function consistency
// ---------------------------------------------------------------------------

describe('cross-function consistency', () => {
  test('toCompletionKey and calendarDateToCompletionKey produce the same key for the same calendar day', () => {
    // 2024-06-15 noon UTC
    const date = new Date('2024-06-15T12:00:00.000Z');
    const fromDate = toCompletionKey(date, 'UTC');
    const fromCalDate = calendarDateToCompletionKey('2024-06-15');
    expect(fromDate).toBe(fromCalDate);
  });

  test('completions lookup with key from toCompletionKey finds the stored value', () => {
    const storedKey = '2024-06-15T00:00:00Z'; // as stored by normalizeToCompletionKey
    const completions: Record<string, number> = { [storedKey]: 3 };

    const lookupKey = toCompletionKey(new Date('2024-06-15T08:00:00.000Z'), 'UTC');
    expect(completions[lookupKey]).toBe(3);
  });
});
