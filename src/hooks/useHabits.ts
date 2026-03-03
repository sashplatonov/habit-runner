import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitColor, HabitFrequency, HabitStats } from '../types/habit';

const STORAGE_KEY = 'habit-tracker-v1';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateSeedData(): Habit[] {
  const today = new Date();
  const completions: Record<string, boolean> = {};

  // Generate 90 days of semi-random completions
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

  return [
  {
    id: 'h1',
    name: 'Deep Work',
    description: '2 hours of focused, distraction-free work',
    color: 'blue',
    icon: '⚡',
    tags: ['productivity', 'focus'],
    frequency: 'daily',
    targetStreak: 30,
    completions,
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    archived: false
  },
  {
    id: 'h2',
    name: 'Exercise',
    description: '30 min workout or run',
    color: 'green',
    icon: '🏃',
    tags: ['health', 'fitness'],
    frequency: 'daily',
    targetStreak: 21,
    completions: completions2,
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    archived: false
  },
  {
    id: 'h3',
    name: 'Read',
    description: '30 pages of non-fiction',
    color: 'purple',
    icon: '📖',
    tags: ['learning', 'growth'],
    frequency: 'weekdays',
    targetStreak: 20,
    completions: completions3,
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    archived: false
  },
  {
    id: 'h4',
    name: 'Meditate',
    description: '10 min mindfulness session',
    color: 'cyan',
    icon: '🧘',
    tags: ['wellness', 'mental'],
    frequency: 'daily',
    targetStreak: 14,
    completions: completions4,
    createdAt: formatDate(new Date(today.getTime() - 60 * 86400000)),
    archived: false
  }];

}

function calculateStreak(completions: Record<string, boolean>): {
  current: number;
  longest: number;
} {
  const today = new Date();
  let current = 0;
  let longest = 0;
  let temp = 0;

  // Current streak
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    if (completions[key]) {
      if (i === 0 || current > 0) current++;
    } else {
      if (i === 0) {
        // Check yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!completions[formatDate(yesterday)]) break;
      } else {
        break;
      }
    }
  }

  // Longest streak
  const sortedDates = Object.keys(completions).
  filter((k) => completions[k]).
  sort();

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
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return generateSeedData();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const toggleCompletion = useCallback((habitId: string, date?: string) => {
    const key = date || formatDate(new Date());
    setHabits((prev) =>
    prev.map((h) =>
    h.id === habitId ?
    {
      ...h,
      completions: { ...h.completions, [key]: !h.completions[key] }
    } :
    h
    )
    );
  }, []);

  const addHabit = useCallback(
    (data: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
      const newHabit: Habit = {
        ...data,
        id: generateId(),
        completions: {},
        createdAt: formatDate(new Date())
      };
      setHabits((prev) => [...prev, newHabit]);
      return newHabit.id;
    },
    []
  );

  const updateHabit = useCallback((id: string, data: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => h.id === id ? { ...h, ...data } : h));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
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
      const completedDays = Object.values(habit.completions).filter(
        Boolean
      ).length;
      const totalDays = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(habit.createdAt).getTime()) / 86400000
        )
      );

      // Weekly data (last 12 weeks)
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

      // Monthly data (last 6 months)
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
      'Dec'];

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
        monthDate.getMonth() === today.getMonth() ?
        today.getDate() :
        daysInMonth;
        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          rate: Math.round(completed / Math.max(1, daysElapsed) * 100)
        });
      }

      return {
        totalDays,
        completedDays,
        currentStreak: current,
        longestStreak: longest,
        completionRate: Math.round(completedDays / totalDays * 100),
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
    return Math.round(completed / active.length * 100);
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