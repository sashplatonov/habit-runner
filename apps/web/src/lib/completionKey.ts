/**
 * Single source of truth for completion key format.
 *
 * Canonical format: "YYYY-MM-DDT00:00:00Z"
 *   - Used as keys in habit.completions records
 *   - All persistence, lookup and sync code must use this format
 *
 * Freeze-day format: "YYYY-MM-DD"
 *   - Used in habit.freezeDays arrays
 *   - Extract with completionKeyToCalendarDate()
 */

import { toCalendarDateKey, extractCalendarDate } from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '@/lib/time/userTimezone';

/**
 * Creates a canonical completion key from a JS Date.
 * Respects the user's local timezone so the date matches what they see on screen.
 *
 * @example toCompletionKey(new Date('2024-01-15T23:00:00Z'), 'UTC+2') → "2024-01-16T00:00:00Z"
 */
export function toCompletionKey(date: Date, timeZone = getCurrentUserTimeZone()): string {
  return toCalendarDateKey(date, timeZone);
}

/**
 * Creates a canonical completion key from a plain "YYYY-MM-DD" calendar date string.
 *
 * @example calendarDateToCompletionKey("2024-01-15") → "2024-01-15T00:00:00Z"
 */
export function calendarDateToCompletionKey(calendarDate: string): string {
  return `${calendarDate}T00:00:00Z`;
}

/**
 * Extracts the "YYYY-MM-DD" portion from any completion key or ISO date string.
 * Use this to derive a freeze-day key from a completion key.
 *
 * @example completionKeyToCalendarDate("2024-01-15T00:00:00Z") → "2024-01-15"
 */
export function completionKeyToCalendarDate(key: string): string {
  return extractCalendarDate(key) ?? key.slice(0, 10);
}

/**
 * Normalizes any date string to the canonical completion key format.
 * Handles: "YYYY-MM-DD", "YYYY-MM-DDT..." ISO variants, and already-canonical keys.
 *
 * @example normalizeToCompletionKey("2024-01-15") → "2024-01-15T00:00:00Z"
 * @example normalizeToCompletionKey("2024-01-15T14:30:00.000Z") → "2024-01-15T00:00:00Z"
 */
export function normalizeToCompletionKey(rawDate: string): string {
  const calendarDate = extractCalendarDate(rawDate);
  return calendarDate ? `${calendarDate}T00:00:00Z` : rawDate;
}
