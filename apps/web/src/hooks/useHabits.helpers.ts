import type { CheckinEntity } from '@/lib/storage/db';

function normalizeDateKey(date: string): string {
  // Normalize legacy date-only strings to UTC ISO without milliseconds
  const iso = new Date(date).toISOString();
  return iso.replace('.000', '');
}

export function buildCompletionsByHabitId(checkins: CheckinEntity[]): Record<string, Record<string, number>> {
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
