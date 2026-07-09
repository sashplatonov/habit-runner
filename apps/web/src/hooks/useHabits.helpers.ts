import { normalizeToCompletionKey } from '@/lib/completionKey';

type CheckinLike = {
  habitId: string;
  date: string;
  done: boolean;
  count?: number;
};

function normalizeDateKey(date: string): string {
  return normalizeToCompletionKey(date);
}

export function buildCompletionsByHabitId(checkins: CheckinLike[]): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  for (const checkin of checkins ?? []) {
    if (!checkin.done) {continue;}
    const habitId = checkin.habitId;
    const dateKey = normalizeDateKey(checkin.date);
    const count = Math.max(1, Math.trunc(checkin.count ?? 1));
    map[habitId] = map[habitId] ?? {};
    map[habitId][dateKey] = (map[habitId][dateKey] ?? 0) + count;
  }
  return map;
}
