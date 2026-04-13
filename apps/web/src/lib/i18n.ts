export const APP_LOCALE = 'en-US';

export function formatAppDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleDateString(APP_LOCALE, options);
}
