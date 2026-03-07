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

  const completionsByHabitId = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    (checkinEntities ?? []).forEach((checkin) => {
      if (!checkin.done) {
        return;
      }
      const habitMap = map[checkin.habitId] ?? {};
      habitMap[checkin.date] = true;
      map[checkin.habitId] = habitMap;
    });
    return map;
  }, [checkinEntities]);

  const allHabits = useMemo<Habit[]>(() => {
    if (!habitEntities) {
      return [];
    }
    return habitEntities.map((entity) => {
      const domain = habitEntityToDomain(entity);
      return {
        ...domain,
        completions: completionsByHabitId[domain.id] ?? {}
      };
    });
  }, [habitEntities, completionsByHabitId]);

  const habits = useMemo(() => allHabits.filter((habit) => !habit.archived), [allHabits]);

  const toggleCompletion = useCallback(async (habitId: string, date?: string) => {
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
    const hasCompletion = Boolean(existingCheckin);

    if (hasCompletion) {
      await deleteCheckinInDb(habitId, key);
    } else {
      await upsertCheckinInDb(habitId, key, true);
    }

    const entity = await db.habits.get(habitId);
    if (!entity) {
      return;
    }
    const base = habitEntityToDomain(entity);
    const updatedHabit: Habit = {
      ...base,
      updatedAt: new Date().toISOString(),
      version: (entity.version ?? 0) + 1
    };

    await persistHabitInDb(updatedHabit);

    const payload = hasCompletion
      ? { habitId, date: key }
      : {
          habitId,
          date: key,
          done: true,
          version: updatedHabit.version ?? 1
        };

    const entry = createOutboxEntry(
      'checkin',
      hasCompletion ? 'delete' : 'upsert',
      payload
    );

    await enqueueOutboxEntry(entry);
  }, []);

  const addHabit = useCallback(
    async (data: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const newHabit: Habit = {
        ...data,
        id: generateId(),
        completions: {},
        createdAt: now,
        updatedAt: now,
        version: 1,
        archived: data.archived ?? false
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

  const deleteHabit = useCallback((id: string) => {
    (async () => {
      const entity = await db.habits.get(id);
      if (!entity) {
        return;
      }
      const version = entity.version ?? 1;
      await addTombstone('habit', id, version);
      await removeHabitFromDb(id);
      const entry = createOutboxEntry('habit', 'delete', { id, version });
      await enqueueOutboxEntry(entry);
    })();
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

      const { current, longest } = calculateStreak(habit.completions);
      const completedDays = countCompletedDays(habit.completions);
      const totalDays = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(habit.createdAt).getTime()) / 86400000
        )
      );

      const weeklyData = buildWeeklyCompletionData(habit.completions);
      const monthlyData = buildMonthlyCompletionRates(habit.completions);

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
    const completed = habits.filter((h) => h.completions[today]).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits]);

  return {
    habits,
    allHabits,
    toggleCompletion,
    addHabit,
    updateHabit,
    deleteHabit,
    getHabitStats,
    getTodayCompletionRate,
    formatDate
  };
}
