export function toSyncISO(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  }
  return d.toISOString().replace(/\.\d+Z$/, 'Z');
}

export function nowSyncISO(): string {
  return toSyncISO(new Date());
}

export const DEFAULT_TIMEZONE = 'UTC';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
};

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function toZonedDateParts(date: Date | string | number, timeZone: string): ZonedDateParts {
  const value = new Date(date);
  const formatter = getFormatter(normalizeTimeZone(timeZone));
  const parts = formatter.formatToParts(value);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day)
  };
}

export function normalizeTimeZone(value?: string | null, fallback = DEFAULT_TIMEZONE): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return fallback;
  }
}

export function formatCalendarDateInTimeZone(
  date: Date | string | number,
  timeZone: string
): string {
  const parts = toZonedDateParts(date, timeZone);
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day
    .toString()
    .padStart(2, '0')}`;
}

export function extractCalendarDate(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function calendarDateToDate(value: string): Date {
  const [year, month, day] = value.split('-').map((segment) => Number(segment));
  return new Date(Date.UTC(year, month - 1, day));
}

export function toCalendarDateKey(
  date: Date | string | number,
  timeZone: string
): string {
  return `${formatCalendarDateInTimeZone(date, timeZone)}T00:00:00Z`;
}

export function addDaysToCalendarDate(value: string, days: number): string {
  const date = calendarDateToDate(value);
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return toSyncISO(date).slice(0, 10);
}

export function getWeekdayFromCalendarDate(value: string): number {
  return calendarDateToDate(value).getUTCDay();
}

export function diffCalendarDays(start: string, end: string): number {
  const startDate = calendarDateToDate(start);
  const endDate = calendarDateToDate(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}
