import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitColor, HabitFrequency, HabitStats } from '../types/habit';
import {
  loadHabitsFromDb,
  persistHabitInDb,
  removeHabitFromDb,
  addTombstone,
  upsertCheckinInDb,
  deleteCheckinInDb,
  enqueueOutboxEntry,
  createOutboxEntry
} from '../lib/db';
import { generateId } from '../lib/id';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateSeedData(): Habit[] {
  const today = new Date();
  const baseDay = new Date(today.getTime() - 90 * 86400000);
  const completions: Record<string, boolean> = {};

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    completions[key] = Math.random() > 0.25;
  }

  const completions2: Record<string, boolean> = {};
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    completions2[key] = Math.random() > 0.35;
  }

  const completions3: Record<string, boolean> = {};
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    completions3[key] = i % 7 !== 0 && i % 7 !== 6 && Math.random() > 0.2;
  }

  const completions4: Record<string, boolean> = {};
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    completions4[key] = Math.random() > 0.45;
  }

  const defaults = [
    {
      id: 'h1',
      name: 'Deep Work',
      description: '2 hours of focused, distraction-free work',
      color: 'blue' as HabitColor,
      icon: '⚡',
      tags: ['productivity', 'focus'],
      frequency: 'daily' as HabitFrequency,
      targetStreak: 30,
      completions,
      createdAt: baseDay.toISOString(),
      updatedAt: baseDay.toISOString(),
      version: 1,
      archived: false
    },
    {
      id: 'h2',
      name: 'Exercise',
      description: '30 min workout or run',
      color: 'green' as HabitColor,
      icon: '🏃',
      tags: ['health', 'fitness'],
      frequency: 'daily' as HabitFrequency,
      targetStreak: 21,
      completions: completions2,
      createdAt: baseDay.toISOString(),
      updatedAt: baseDay.toISOString(),
      version: 1,
      archived: false
    },
    {
      id: 'h3',
      name: 'Read',
      description: '30 pages of non-fiction',
      color: 'purple' as HabitColor,
      icon: '📖',
      tags: ['learning', 'growth'],
      frequency: 'weekdays' as HabitFrequency,
      targetStreak: 20,
      completions: completions3,
      createdAt: baseDay.toISOString(),
      updatedAt: baseDay.toISOString(),
      version: 1,
      archived: false
    },
    {
      id: 'h4',
      name: 'Meditate',
      description: '10 min mindfulness session',
      color: 'cyan' as HabitColor,
      icon: '🧘',
      tags: ['wellness', 'mental'],
      frequency: 'daily' as HabitFrequency,
      targetStreak: 14,
      completions: completions4,
      createdAt: new Date(today.getTime() - 60 * 86400000).toISOString(),
      updatedAt: new Date(today.getTime() - 60 * 86400000).toISOString(),
      version: 1,
      archived: false
    }
  ];

  return defaults;
}

function calculateStreak(completions: Record<string, boolean>): {
  current: number;
  longest: number;
} {
  const today = new Date();
  let current = 0;
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    if (completions[key]) {
      if (i === 0 || current > 0) current++;
    } else {
      if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!completions[formatDate(yesterday)]) break;
      } else {
        break;
      }
    }
  }

  const sortedDates = Object.keys(completions)
    .filter((k) => completions[k])
    .sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        temp++;
      } else {
        temp = 1;
      }
    }
    if (temp > longest) longest = temp;
  }

  return { current, longest };
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadHabitsFromDb();
      if (stored.length === 0) {
        const seed = generateSeedData();
        await Promise.all(seed.map((habit) => persistHabitInDb(habit)));
        if (mounted) setHabits(seed);
        return;
      }
      if (mounted) setHabits(stored);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCompletion = useCallback((habitId: string, date?: string) => {
    const key = date || formatDate(new Date());
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
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
    (data: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
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
      void persistHabitInDb(newHabit);
      const entry = createOutboxEntry('habit', 'upsert', newHabit);
      void enqueueOutboxEntry(entry);
      return newHabit.id;
    },
    []
  );

  const updateHabit = useCallback((id: string, data: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;
        const updatedHabit: Habit = {
          ...habit,
          ...data,
          updatedAt: new Date().toISOString(),
          version: (habit.version ?? 1) + 1
        };
        void persistHabitInDb(updatedHabit);
        const entry = createOutboxEntry('habit', 'upsert', updatedHabit);
        void enqueueOutboxEntry(entry);
        return updatedHabit;
      })
    );
  }, []);

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
        return {
          totalDays: 0,
          completedDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          completionRate: 0,
          weeklyData: [],
          monthlyData: []
        };

      const { current, longest } = calculateStreak(habit.completions);
      const completedDays = Object.values(habit.completions).filter(Boolean)
        .length;
      const totalDays = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(habit.createdAt).getTime()) / 86400000
        )
      );

      const today = new Date();
      const weeklyData = [];
      for (let w = 11; w >= 0; w--) {
        let count = 0;
        for (let d = 0; d < 7; d++) {
          const date = new Date(today);
          date.setDate(date.getDate() - w * 7 - d);
          const key = formatDate(date);
          if (habit.completions[key]) count++;
        }
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - w * 7);
        weeklyData.push({
          week: `W${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          count
        });
      }

      const monthlyData = [];
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];

      for (let m = 5; m >= 0; m--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const daysInMonth = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        ).getDate();
        let completed = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            d
          );
          if (date > today) break;
          const key = formatDate(date);
          if (habit.completions[key]) completed++;
        }
        const daysElapsed =
          monthDate.getMonth() === today.getMonth()
            ? today.getDate()
            : daysInMonth;
        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          rate: Math.round((completed / Math.max(1, daysElapsed)) * 100)
        });
      }

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
    if (active.length === 0) return 0;
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
