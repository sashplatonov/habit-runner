import type { Habit } from '@/types/habit';
import { buildCompletionsByHabitId } from '@/hooks/useHabits.helpers';
import { completionKeyToCalendarDate } from '$lib/completionKey';
import { formatDate } from '$lib/habits/habitStats';
import { habitEntityToDomain, type CheckinEntity, type HabitEntity } from '$lib/storage/db';

export interface HabitsSnapshot {
  habits: Habit[];
  allHabits: Habit[];
  formatDate: typeof formatDate;
}

function applyFreezeDays(
  baseCompletions: Record<string, number>,
  freezeDays: string[] | undefined,
  dailyTarget: number
) {
  (freezeDays ?? []).forEach((date) => {
    const completionKey = date.includes('T') ? date : `${date}T00:00:00Z`;
    const existing = baseCompletions[completionKey] ?? 0;
    baseCompletions[completionKey] = Math.max(dailyTarget, existing);
  });
}

function buildHabitFromEntity(
  entity: HabitEntity,
  completionsByHabitId: Record<string, Record<string, number>>
): Habit {
  const domain = habitEntityToDomain(entity);
  const dailyTarget = Math.max(1, domain.dailyTarget ?? 1);
  const completions = { ...(completionsByHabitId[domain.id] ?? {}) };
  applyFreezeDays(completions, domain.freezeDays, dailyTarget);

  return {
    ...domain,
    completions,
    freezeDays: (domain.freezeDays ?? []).map((date) => completionKeyToCalendarDate(date))
  };
}

function sortHabitsByOrder(habits: Habit[]) {
  const sorted = [...habits];
  return sorted.sort((firstHabit, secondHabit) => {
    const first = firstHabit.sortOrder ?? 0;
    const second = secondHabit.sortOrder ?? 0;
    if (first !== second) {
      return first - second;
    }

    return firstHabit.createdAt.localeCompare(secondHabit.createdAt);
  });
}

export function createHabitsSnapshot(
  habitEntities: HabitEntity[],
  checkinEntities: CheckinEntity[]
): HabitsSnapshot {
  const completionsByHabitId = buildCompletionsByHabitId(checkinEntities);
  const allHabits = habitEntities.map((entity) => buildHabitFromEntity(entity, completionsByHabitId));
  const orderedHabits = sortHabitsByOrder(allHabits);

  return {
    habits: orderedHabits.filter((habit) => !habit.archived),
    allHabits: orderedHabits,
    formatDate
  };
}