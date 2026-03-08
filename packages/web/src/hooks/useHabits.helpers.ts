import type { CheckinEntity } from '@/lib/storage/db';

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
    habitMap[checkin.date] = (habitMap[checkin.date] ?? 0) + Math.max(1, checkin.count ?? 1);
    map[checkin.habitId] = habitMap;
  }
  return map;
}
