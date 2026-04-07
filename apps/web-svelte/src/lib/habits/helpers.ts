import type { CheckinEntity } from '$lib/storage/db';
import { normalizeToCompletionKey } from '$lib/completionKey';

export type CheckinCompletionMap = Record<string, Record<string, number>>;

export function buildCompletionsByHabitId(
  checkins: CheckinEntity[] = []
): CheckinCompletionMap {
  const map: CheckinCompletionMap = {};
  for (const checkin of checkins) {
    if (!checkin.done) {
      continue;
    }
    const habitMap = map[checkin.habitId] ?? {};
    const completionKey = normalizeToCompletionKey(checkin.date);
    habitMap[completionKey] = (habitMap[completionKey] ?? 0) + Math.max(1, checkin.count ?? 1);
    map[checkin.habitId] = habitMap;
  }
  return map;
}
