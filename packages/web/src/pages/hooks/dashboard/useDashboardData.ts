import { useMemo } from 'react';
import type { Habit } from '@/types/habit';
import { resolveHabitSchedule, isScheduledForDate } from '@/lib/habits/schedule';
import { formatDate as formatHabitDate } from '@/lib/habits/habitStats';

export type DashboardFilter = 'all' | 'pending' | 'done' | 'archived';

export interface DashboardDataOptions {
  habits: Habit[];
  filter: DashboardFilter;
  selectedTags: string[];
  today: Date;
  sortMode: 'custom' | 'smart';
  searchQuery: string;
}

export function useDashboardData({
  habits,
  filter,
  selectedTags,
  today,
  sortMode,
  searchQuery
}: DashboardDataOptions) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    habits.forEach((habit) => (habit.tags || []).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [habits]);

  const todayKey = formatHabitDate(today);

  const filtered = useMemo(() => {
    return habits
      .filter((habit) => {
        // Tag filter
        if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) {
          return false;
        }

        // Archive and Search filters
        if (!PassesBasicFilters(habit, filter, searchQuery)) {
          return false;
        }

        // Dashboard specific filters (pending/done)
        const schedule = resolveHabitSchedule(habit);
        const scheduledToday = isScheduledForDate(schedule, today);
        const completedToday = (habit.completions[todayKey] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);

        if (filter === 'pending') {
          return scheduledToday && !completedToday;
        }
        if (filter === 'done') {
          return scheduledToday && completedToday;
        }
        return true;
      })
      .sort((a, b) => SortHabits(a, b, sortMode));
  }, [habits, filter, selectedTags, today, todayKey, sortMode, searchQuery]);

  const overallStreak = useMemo(() => CalculateOverallStreak(habits), [habits]);

  return { allTags, filtered, overallStreak };
}

function PassesBasicFilters(habit: Habit, filter: DashboardFilter, searchQuery: string): boolean {
  // Archive filter
  const isArchived = habit.archived;
  if (filter === 'archived') {
    if (!isArchived) {
      return false;
    }
  } else if (isArchived) {
    return false;
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const nameMatch = habit.name.toLowerCase().includes(q);
    const descMatch = habit.description?.toLowerCase().includes(q) ?? false;
    if (!nameMatch && !descMatch) {
      return false;
    }
  }
  return true;
}

function SortHabits(a: Habit, b: Habit, sortMode: 'custom' | 'smart'): number {
  const orderA = a.sortOrder ?? 0;
  const orderB = b.sortOrder ?? 0;

  if (sortMode === 'custom') {
    return orderA - orderB;
  }

  // Smart Sort
  if (a.difficulty !== b.difficulty) {
    return (a.difficulty ?? 1) - (b.difficulty ?? 1);
  }
  return orderA - orderB;
}

function CalculateOverallStreak(habits: Habit[]): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().split('T')[0];
    const keyDate = new Date(cursor);
    keyDate.setHours(0, 0, 0, 0);

    const allDone = habits.every((habit) => {
      const schedule = resolveHabitSchedule(habit);
      if (!isScheduledForDate(schedule, keyDate)) {
        return true;
      }
      return (habit.completions[key] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
    });

    if (allDone) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
