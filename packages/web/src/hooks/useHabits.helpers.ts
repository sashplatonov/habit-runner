import { extractCalendarDate } from '@habbit-runner/shared';
import type { CheckinEntity } from '@/lib/storage/db';

export type CheckinCompletionMap = Record<string, Record<string, number>>;

function normalizeCompletionKey(date: string): string {
  const calendarDate = extractCalendarDate(date);
  return calendarDate ? `${calendarDate}T00:00:00Z` : date;
}

export function buildCompletionsByHabitId(
  checkins: CheckinEntity[] = []
): CheckinCompletionMap {
  const map: CheckinCompletionMap = {};
  for (const checkin of checkins) {
    if (!checkin.done) {
      continue;
    }
    const habitMap = map[checkin.habitId] ?? {};
    const completionKey = normalizeCompletionKey(checkin.date);
    habitMap[completionKey] = (habitMap[completionKey] ?? 0) + Math.max(1, checkin.count ?? 1);
    map[checkin.habitId] = habitMap;
  }
  return map;
}
