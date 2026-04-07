import { toCalendarDateKey, extractCalendarDate } from '@habbit-runner/shared';
import { getCurrentUserTimeZone } from '$lib/time/userTimezone';

export function toCompletionKey(date: Date, timeZone = getCurrentUserTimeZone()): string {
  return toCalendarDateKey(date, timeZone);
}

export function calendarDateToCompletionKey(calendarDate: string): string {
  return `${calendarDate}T00:00:00Z`;
}

export function completionKeyToCalendarDate(key: string): string {
  return extractCalendarDate(key) ?? key.slice(0, 10);
}

export function normalizeToCompletionKey(rawDate: string): string {
  const calendarDate = extractCalendarDate(rawDate);
  return calendarDate ? `${calendarDate}T00:00:00Z` : rawDate;
}
