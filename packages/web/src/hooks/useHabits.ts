import { useCallback, useMemo } from 'react';
import type { Habit, HabitStats } from '@/types/habit';
import {
  db,
  habitEntityToDomain,
  persistHabitInDb,
  removeHabitFromDb,
  addTombstone,
  upsertCheckinInDb,
  deleteCheckinInDb,
  createOutboxEntry,
  getCurrentUserId
} from '@/lib/storage/db';
import { syncEntriesWithFallback } from '@/lib/sync/writeThrough';
import { createHabitId } from '@/lib/core/habit-id';
import {
  buildMonthlyCompletionRates,
  buildWeeklyCompletionData,
  countCompletedDays,
  formatDate
} from '@/lib/habits/habitStats';
import { calculateScheduledCompletionRate, calculateScheduledStreak } from '@/lib/habits/schedule';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { buildCompletionsByHabitId } from '@/hooks/useHabits.helpers';

type ToggleCompletionResult = {
  habitId: string;
  date: string;
  count: number;
};

type HabitUpsertInput = Omit<Habit, 'id' | 'completions' | 'createdAt'> & {
  sortOrder?: number;
  reminderTime?: string | null;
};

function applyFreezeDays(
  baseCompletions: Record<string, number>,
  freezeDays: string[] | undefined,
  dailyTarget: number
) {
  (freezeDays ?? []).forEach((date) => {
    const existing = baseCompletions[date] ?? 0;
    baseCompletions[date] = Math.max(dailyTarget, existing);
  });
}

function buildHabitFromEntity(
  entity: Parameters<typeof habitEntityToDomain>[0],
  completionsByHabitId: Record<string, Record<string, number>>
): Habit {
  const domain = habitEntityToDomain(entity);
  const dailyTarget = Math.max(1, domain.dailyTarget ?? 1);
  const completions = { ...(completionsByHabitId[domain.id] ?? {}) };
  applyFreezeDays(completions, domain.freezeDays, dailyTarget);
  return {
    ...domain,
    completions
  };
}

function mapHabits(
  entities: Parameters<typeof habitEntityToDomain>[0][],
  completionsByHabitId: Record<string, Record<string, number>>
) {
  return entities.map((entity) => buildHabitFromEntity(entity, completionsByHabitId));
}

function sortHabitsByOrder(habits: Habit[]) {
  const sorted = [...habits];
  return sorted.sort((a, b) => {
    const first = a.sortOrder ?? 0;
    const second = b.sortOrder ?? 0;
    if (first !== second) {
      return first - second;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

async function persistHabitWithSyncFallback(habit: Habit, action: 'upsert' | 'delete') {
  if (action === 'delete') {
    await removeHabitFromDb(habit.id);
  } else {
    await persistHabitInDb(habit);
  }
  const entry = createOutboxEntry('habit', action, habit);
  await syncEntriesWithFallback([entry]);
}

// Handles both single and multi-target completion toggles with shared persistence logic.
// eslint-disable-next-line complexity
async function toggleCompletionImpl(
  habitId: string,
  date: string | undefined,
  userId: string
): Promise<ToggleCompletionResult> {
  const key = date || formatDate(new Date());
  const existingCheckin = await db.checkins
    .where('habitId')
    .equals(habitId)
    .filter((record) => record.date === key && record.userId === userId && record.done)
    .first();
  const currentCount = existingCheckin && existingCheckin.done
    ? Math.max(1, Math.trunc(existingCheckin.count ?? 1))
    : 0;
  const nextCount = currentCount > 0 ? 0 : 1;

  if (nextCount > 0) {
    await upsertCheckinInDb(habitId, key, true, nextCount);
  } else {
    await deleteCheckinInDb(habitId, key);
  }

  const entity = await db.habits.get(habitId);
  if (entity) {
    const updatedHabit: Habit = {
      ...habitEntityToDomain(entity),
      updatedAt: new Date().toISOString(),
      version: (entity.version ?? 0) + 1
    };
    await persistHabitInDb(updatedHabit);
  }

  const payload = nextCount === 0
    ? { habitId, date: key }
    : {
        habitId,
        date: key,
        done: true,
        count: nextCount,
        version: entity?.version ?? 1
      };
  const entry = createOutboxEntry('checkin', nextCount === 0 ? 'delete' : 'upsert', payload);
  await syncEntriesWithFallback([entry]);

  return { habitId, date: key, count: nextCount };
}

async function addHabitImpl(data: HabitUpsertInput) {
  const now = new Date().toISOString();
  const newHabit: Habit = {
    ...data,
    id: createHabitId(data.name),
    completions: {},
    dailyTarget: Math.max(1, Math.trunc(data.dailyTarget ?? 1)),
    createdAt: now,
    updatedAt: now,
    version: 1,
    sortOrder: data.sortOrder ?? Date.now(),
    reminderTime: data.reminderTime ?? undefined,
    reminderEnabled: data.reminderEnabled ?? true,
    archived: data.archived ?? false,
    freezeDays: data.freezeDays ?? []
  };
  await persistHabitWithSyncFallback(newHabit, 'upsert');
  return newHabit.id;
}

async function updateHabitImpl(id: string, data: Partial<Habit>) {
  const entity = await db.habits.get(id);
  if (!entity) {
    return;
  }
  const existing = habitEntityToDomain(entity);
  const updatedHabit: Habit = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
    version: (entity.version ?? 0) + 1
  };
  await persistHabitWithSyncFallback(updatedHabit, 'upsert');
}

async function deleteHabitImpl(id: string, allHabits: Habit[]) {
  const entity = await db.habits.get(id);
  const backup = allHabits.find((h) => h.id === id);
  if (!entity) {
    return backup;
  }
  const version = entity.version ?? 1;
  await addTombstone('habit', id, version);
  await removeHabitFromDb(id);
  const entry = createOutboxEntry('habit', 'delete', { id, version });
  await syncEntriesWithFallback([entry]);
  return backup;
}

async function restoreHabitImpl(habit: Habit) {
  await persistHabitInDb(habit);
  await db.tombstones.where({ entity: 'habit', entityId: habit.id }).delete();
  const entries = [createOutboxEntry('habit', 'upsert', habit)];
  const completionEntries = Object.entries(habit.completions).filter(([, count]) => count > 0);
  for (const [date, count] of completionEntries) {
    await upsertCheckinInDb(habit.id, date, true, count);
    entries.push(createOutboxEntry('checkin', 'upsert', {
      habitId: habit.id,
      date,
      done: true,
      count
    }));
  }
  await syncEntriesWithFallback(entries);
}

async function setCompletionCountImpl(
  habitId: string,
  date: string,
  count: number,
  allHabits: Habit[]
): Promise<ToggleCompletionResult> {
  const normalizedCount = Math.max(0, Math.trunc(count));
  const habit = allHabits.find((item) => item.id === habitId);
  const maxCount = Math.max(1, habit?.dailyTarget ?? 1);
  const clampedCount = Math.min(normalizedCount, maxCount);

  if (clampedCount > 0) {
    await upsertCheckinInDb(habitId, date, true, clampedCount);
  } else {
    await deleteCheckinInDb(habitId, date);
  }

  const entity = await db.habits.get(habitId);
  if (entity) {
    const updatedHabit: Habit = {
      ...habitEntityToDomain(entity),
      updatedAt: new Date().toISOString(),
      version: (entity.version ?? 0) + 1
    };
    await persistHabitInDb(updatedHabit);
  }

  const payload = clampedCount === 0
    ? { habitId, date }
    : { habitId, date, done: true, count: clampedCount };
  const entry = createOutboxEntry('checkin', clampedCount === 0 ? 'delete' : 'upsert', payload);
  await syncEntriesWithFallback([entry]);
  return { habitId, date, count: clampedCount };
}

function getTodayCompletionRateImpl(habits: Habit[]): number {
  if (habits.length === 0) {
    return 0;
  }
  const today = formatDate(new Date());
  const completed = habits.filter((habit) => (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)).length;
  return Math.round((completed / habits.length) * 100);
}

function getHabitStatsImpl(habitId: string, allHabits: Habit[]): HabitStats {
  const habit = allHabits.find((item) => item.id === habitId);
  if (!habit) {
    return {
      totalDays: 0,
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      weeklyData: [],
      monthlyData: []
    };
  }
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const { current, longest } = calculateScheduledStreak(habit, habit.completions, new Date());
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, new Date());
  const completedDays = countCompletedDays(habit.completions, dailyTarget);
  const totalDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 86400000)
  );
  return {
    totalDays,
    completedDays,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    weeklyData: buildWeeklyCompletionData(habit.completions, 12, new Date(), dailyTarget),
    monthlyData: buildMonthlyCompletionRates(habit.completions, 6, new Date(), dailyTarget)
  };
}

export function useHabits() {
  const currentUserId = getCurrentUserId();
  const habitEntities = useLiveQuery(
    () => db.habits.where({ userId: currentUserId }).toArray(),
    [currentUserId]
  );
  const checkinEntities = useLiveQuery(
    () => db.checkins.where({ userId: currentUserId }).toArray(),
    [currentUserId]
  );

  const completionsByHabitId = useMemo(
    () => buildCompletionsByHabitId(checkinEntities ?? []),
    [checkinEntities]
  );

  const allHabits = useMemo(
    () => mapHabits(habitEntities ?? [], completionsByHabitId),
    [habitEntities, completionsByHabitId]
  );

  const orderedHabits = useMemo(() => sortHabitsByOrder(allHabits), [allHabits]);
  const habits = useMemo(() => orderedHabits.filter((habit) => !habit.archived), [orderedHabits]);

  const toggleCompletion = useCallback(
    (habitId: string, date?: string) => toggleCompletionImpl(habitId, date, currentUserId),
    [currentUserId]
  );

  const addHabit = useCallback((data: HabitUpsertInput) => addHabitImpl(data), []);
  const updateHabit = useCallback((id: string, data: Partial<Habit>) => updateHabitImpl(id, data), []);
  const deleteHabit = useCallback((id: string) => deleteHabitImpl(id, allHabits), [allHabits]);
  const restoreHabit = useCallback((habit: Habit) => restoreHabitImpl(habit), []);
  const getHabitStats = useCallback((habitId: string) => getHabitStatsImpl(habitId, allHabits), [allHabits]);
  const getTodayCompletionRate = useCallback(() => getTodayCompletionRateImpl(habits), [habits]);
  const setCompletionCount = useCallback(
    (habitId: string, date: string, count: number) => setCompletionCountImpl(habitId, date, count, allHabits),
    [allHabits]
  );

  return {
    habits,
    allHabits,
    toggleCompletion,
    setCompletionCount,
    addHabit,
    updateHabit,
    deleteHabit,
    restoreHabit,
    getHabitStats,
    getTodayCompletionRate,
    formatDate
  };
}
