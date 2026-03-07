import { useState, useEffect, useCallback } from 'react';
import type { Habit, HabitStats } from '@/types/habit';
import {
  loadHabitsFromDb,
  persistHabitInDb,
  removeHabitFromDb,
  addTombstone,
  upsertCheckinInDb,
  deleteCheckinInDb,
  enqueueOutboxEntry,
  createOutboxEntry
} from '@/lib/storage/db';
import { generateId } from '@/lib/core/id';
import {
  buildMonthlyCompletionRates,
  buildWeeklyCompletionData,
  calculateStreak,
  countCompletedDays,
  formatDate
} from '@/lib/habits/habitStats';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadHabitsFromDb();
      if (mounted) {setHabits(stored);}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCompletion = useCallback((habitId: string, date?: string) => {
    const key = date || formatDate(new Date());
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) {return habit;}
        const hasCompletion = !!habit.completions[key];
        const updatedCompletions = { ...habit.completions };
        if (hasCompletion) {
          delete updatedCompletions[key];
        } else {
          updatedCompletions[key] = true;
        }

        const updatedHabit: Habit = {
          ...habit,
          completions: updatedCompletions,
          updatedAt: new Date().toISOString(),
          version: (habit.version ?? 1) + 1
        };

        void persistHabitInDb(updatedHabit);
        if (hasCompletion) {
          void deleteCheckinInDb(habitId, key);
        } else {
          void upsertCheckinInDb(habitId, key, true);
        }

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

        void enqueueOutboxEntry(entry);
        return updatedHabit;
      })
    );
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

      setHabits((prev) => [...prev, newHabit]);
      await persistHabitInDb(newHabit);
      const entry = createOutboxEntry('habit', 'upsert', newHabit);
      await enqueueOutboxEntry(entry);
      return newHabit.id;
    },
    []
  );

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
    const existing = habits.find((habit) => habit.id === id);
    if (!existing) {return;}
    const updatedHabit: Habit = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
      version: (existing.version ?? 1) + 1
    };
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? updatedHabit : habit))
    );
    await persistHabitInDb(updatedHabit);
    const entry = createOutboxEntry('habit', 'upsert', updatedHabit);
    await enqueueOutboxEntry(entry);
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => {
      const target = prev.find((habit) => habit.id === id);
      if (target) {
        void addTombstone('habit', id, target.version ?? 1);
        void removeHabitFromDb(id);
        const entry = createOutboxEntry('habit', 'delete', {
          id,
          version: target.version ?? 1
        });
        void enqueueOutboxEntry(entry);
      }
      return prev.filter((habit) => habit.id !== id);
    });
  }, []);

  const getHabitStats = useCallback(
    (habitId: string): HabitStats => {
      const habit = habits.find((h) => h.id === habitId);
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
    [habits]
  );

  const getTodayCompletionRate = useCallback(() => {
    const today = formatDate(new Date());
    const active = habits.filter((h) => !h.archived);
    if (active.length === 0) {return 0;}
    const completed = active.filter((h) => h.completions[today]).length;
    return Math.round((completed / active.length) * 100);
  }, [habits]);

  return {
    habits: habits.filter((h) => !h.archived),
    allHabits: habits,
    toggleCompletion,
    addHabit,
    updateHabit,
    deleteHabit,
    getHabitStats,
    getTodayCompletionRate,
    formatDate
  };
}
