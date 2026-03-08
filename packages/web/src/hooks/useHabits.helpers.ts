import type { CheckinEntity } from '@/lib/storage/db';

export type CheckinCompletionMap = Record<string, Record<string, boolean>>;

export function buildCompletionsByHabitId(
  checkins: CheckinEntity[] = []
): CheckinCompletionMap {
  const map: CheckinCompletionMap = {};
  for (const checkin of checkins) {
    if (!checkin.done) {
      continue;
    }
    const habitMap = map[checkin.habitId] ?? {};
    habitMap[checkin.date] = true;
    map[checkin.habitId] = habitMap;
  }
  return map;
}
