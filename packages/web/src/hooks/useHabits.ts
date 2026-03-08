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
  enqueueOutboxEntry,
  createOutboxEntry,
  getCurrentUserId
} from '@/lib/storage/db';
import { generateId } from '@/lib/core/id';
import {
  buildMonthlyCompletionRates,
  buildWeeklyCompletionData,
  calculateStreak,
  countCompletedDays,
  formatDate
} from '@/lib/habits/habitStats';
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

  const allHabits = useMemo<Habit[]>(() => {
    if (!habitEntities) {
      return [];
    }
    return habitEntities.map((entity) => {
      const domain = habitEntityToDomain(entity);
      const baseCompletions = { ...(completionsByHabitId[domain.id] ?? {}) };
      (domain.freezeDays ?? []).forEach((date) => {
        baseCompletions[date] = Math.max(1, baseCompletions[date] ?? 1);
      });
      return {
        ...domain,
        completions: baseCompletions
      };
    });
  }, [habitEntities, completionsByHabitId]);

  const orderedHabits = useMemo(() => {
    const copy = [...allHabits];
    return copy.sort((a, b) => {
      const first = a.sortOrder ?? 0;
      const second = b.sortOrder ?? 0;
      if (first !== second) {return first - second;}
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [allHabits]);

  const habits = useMemo(
    () => orderedHabits.filter((habit) => !habit.archived),
    [orderedHabits]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, date?: string): Promise<ToggleCompletionResult> => {
      const key = date || formatDate(new Date());
      const userId = getCurrentUserId();
      const existingCheckin = await db.checkins
        .where('habitId')
        .equals(habitId)
        .filter(
          (record) =>
            record.date === key && record.userId === userId && record.done
        )
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
      if (!entity) {
        return {
          habitId,
          date: key,
          count: nextCount
        };
      }
      const base = habitEntityToDomain(entity);
      const updatedHabit: Habit = {
        ...base,
        updatedAt: new Date().toISOString(),
        version: (entity.version ?? 0) + 1
      };

      await persistHabitInDb(updatedHabit);

      const payload = nextCount === 0
        ? { habitId, date: key }
        : {
            habitId,
            date: key,
            done: true,
            count: nextCount,
            version: updatedHabit.version ?? 1
          };

      const entry = createOutboxEntry(
        'checkin',
        nextCount === 0 ? 'delete' : 'upsert',
        payload
      );

      await enqueueOutboxEntry(entry);
      return {
        habitId,
        date: key,
        count: nextCount
      };
    }, []);

  const addHabit = useCallback(
    async (data: HabitUpsertInput) => {
      const now = new Date().toISOString();
    const newHabit: Habit = {
      ...data,
      id: generateId(),
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

      await persistHabitInDb(newHabit);
      const entry = createOutboxEntry('habit', 'upsert', newHabit);
      await enqueueOutboxEntry(entry);
      return newHabit.id;
    },
    []
  );

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
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
    await persistHabitInDb(updatedHabit);
    const entry = createOutboxEntry('habit', 'upsert', updatedHabit);
    await enqueueOutboxEntry(entry);
  }, []);

  const deleteHabit = useCallback(
    async (id: string) => {
      const entity = await db.habits.get(id);
      const backup = allHabits.find((h) => h.id === id);
      if (!entity) {
        return backup;
      }
      const version = entity.version ?? 1;
      await addTombstone('habit', id, version);
      await removeHabitFromDb(id);
      const entry = createOutboxEntry('habit', 'delete', { id, version });
      await enqueueOutboxEntry(entry);
      return backup;
    },
    [allHabits]
  );

  const restoreHabit = useCallback(async (habit: Habit) => {
    await persistHabitInDb(habit);
    await db.tombstones
      .where({
        entity: 'habit',
        entityId: habit.id
      })
      .delete();
    const habitEntry = createOutboxEntry('habit', 'upsert', habit);
    await enqueueOutboxEntry(habitEntry);
    const completionDates = Object.entries(habit.completions)
      .filter(([, count]) => count > 0);
    for (const [date, count] of completionDates) {
      await upsertCheckinInDb(habit.id, date, true, count);
      const entry = createOutboxEntry('checkin', 'upsert', {
        habitId: habit.id,
        date,
        done: true,
        count
      });
      await enqueueOutboxEntry(entry);
    }
  }, []);

  const getHabitStats = useCallback(
    (habitId: string): HabitStats => {
      const habit = allHabits.find((h) => h.id === habitId);
      if (!habit)
        {return {
          totalDays: 0,
          completedDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          completionRate: 0,
          weeklyData: [],
          monthlyData: []
        };}

      const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
      const { current, longest } = calculateStreak(habit.completions, new Date(), dailyTarget);
      const completedDays = countCompletedDays(habit.completions, dailyTarget);
      const totalDays = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(habit.createdAt).getTime()) / 86400000
        )
      );

      const weeklyData = buildWeeklyCompletionData(habit.completions, 12, new Date(), dailyTarget);
      const monthlyData = buildMonthlyCompletionRates(habit.completions, 6, new Date(), dailyTarget);

      return {
        totalDays,
        completedDays,
        currentStreak: current,
        longestStreak: longest,
        completionRate: Math.round((completedDays / totalDays) * 100),
        weeklyData,
        monthlyData
      };
    },
    [allHabits]
  );

  const getTodayCompletionRate = useCallback(() => {
    const today = formatDate(new Date());
    if (habits.length === 0) {return 0;}
    const completed = habits.filter((h) => (h.completions[today] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits]);

  const setCompletionCount = useCallback(
    async (habitId: string, date: string, count: number): Promise<ToggleCompletionResult> => {
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
      await enqueueOutboxEntry(entry);

      return { habitId, date, count: clampedCount };
    },
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
