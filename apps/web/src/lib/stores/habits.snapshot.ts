import type { Habit } from '@/types/habit';
import { buildCompletionsByHabitId } from '@/hooks/useHabits.helpers';
import { formatDate } from '$lib/habits/habitStats';
import { habitEntityToDomain, type CheckinEntity, type HabitEntity } from '$lib/storage/db';

export interface HabitsSnapshot {
  habits: Habit[];
  allHabits: Habit[];
  formatDate: typeof formatDate;
}

type CheckinSnapshotItem = Pick<CheckinEntity, 'habitId' | 'date' | 'done' | 'count'>;

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
  return createHabitsSnapshotFromDomain(
    habitEntities.map((entity) => habitEntityToDomain(entity)),
    checkinEntities
  );
}

export function createHabitsSnapshotFromDomain(
  habits: Habit[],
  checkinEntities: CheckinSnapshotItem[]
): HabitsSnapshot {
  const completionsByHabitId = buildCompletionsByHabitId(checkinEntities);
  const allHabits = habits.map((habit) => {
    const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
    const completions = { ...(completionsByHabitId[habit.id] ?? {}) };
    applyFreezeDays(completions, habit.freezeDays, dailyTarget);

    return {
      ...habit,
      completions
    };
  });
  const orderedHabits = sortHabitsByOrder(allHabits);

  return {
    habits: orderedHabits.filter((habit) => !habit.archived),
    allHabits: orderedHabits,
    formatDate
  };
}
