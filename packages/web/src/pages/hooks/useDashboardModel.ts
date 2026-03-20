import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { getDaysSinceLastCompletion } from '@/lib/habits/habitStats';
import { isMandatoryToday } from '@/lib/habits/schedule';
import type { Habit } from '@/types/habit';

import { useDashboardData } from './dashboard/useDashboardData';
import { useDashboardHandlers } from './dashboard/useDashboardHandlers';
import { useDragHandlers } from './dashboard/useDragHandlers';
import { useHabitOrderingCallbacks } from './dashboard/useHabitOrderingCallbacks';
import { useReminderTracker } from './dashboard/useReminderTracker';
import type { DashboardFilter } from './dashboard/useDashboardData';

const FILTER_STORAGE_KEY = 'hr_dashboard_filter_v1';
const DENSITY_STORAGE_KEY = 'hr_dashboard_density_v1';
const HERO_COLLAPSED_STORAGE_KEY = 'hr_dashboard_hero_collapsed_v1';

function readStoredFilter(): DashboardFilter {
  if (typeof window === 'undefined') {
    return 'pending';
  }
  const stored = localStorage.getItem(FILTER_STORAGE_KEY);
  const valid: DashboardFilter[] = ['all', 'pending', 'done', 'archived'];
  return (valid as string[]).includes(stored || '') ? (stored as DashboardFilter) : 'pending';
}

function readStoredViewDensity(): 'comfortable' | 'compact' {
  if (typeof window === 'undefined') {
    return 'comfortable';
  }
  return localStorage.getItem(DENSITY_STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable';
}

function readStoredHeroCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(HERO_COLLAPSED_STORAGE_KEY) === '1';
}

function buildDashboardSummary(activeHabits: Habit[], todayDate: Date, today: string) {
  const scheduledTodayHabits = activeHabits.filter((habit) => isMandatoryToday(habit, todayDate));
  const completedToday = scheduledTodayHabits.filter((habit) =>
    habit.type === 'negative'
      ? (habit.completions[today] ?? 0) === 0
      : (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;
  const totalActive = scheduledTodayHabits.length;
  return {
    scheduledTodayHabits,
    completedToday,
    totalActive,
    todayRate: totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0
  };
}

export function useDashboardModel() {
  const navigate = useNavigate();
  const { allHabits, setCompletionCount, advanceCompletionCount, addHabit, updateHabit, formatDate } = useHabits();
  const { push } = useUndo();

  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'custom' | 'smart'>('custom');

  const [filter, setFilter] = useState<DashboardFilter>(readStoredFilter);
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>(readStoredViewDensity);
  const [heroCollapsed, setHeroCollapsed] = useState(readStoredHeroCollapsed);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem(DENSITY_STORAGE_KEY, viewDensity);
  }, [viewDensity]);

  useEffect(() => {
    localStorage.setItem(HERO_COLLAPSED_STORAGE_KEY, heroCollapsed ? '1' : '0');
  }, [heroCollapsed]);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const today = formatDate(todayDate);
  const activeHabits = useMemo(() => allHabits.filter(h => !h.archived), [allHabits]);
  const summary = useMemo(
    () => buildDashboardSummary(activeHabits, todayDate, today),
    [activeHabits, todayDate, today]
  );
  const dateStr = formatAppDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' });

  const remindersHook = useReminderTracker(summary.scheduledTodayHabits, formatDate, (habit) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification('Habbit reminder', {
        body: `Time for: ${habit.name}`,
        tag: `habit-reminder-${habit.id}`
      });
    } catch {
      // ignore
    }
  });

  const data = useDashboardData({
    habits: allHabits,
    filter,
    selectedTags,
    today: todayDate,
    sortMode,
    searchQuery
  });

  const handlers = useDashboardHandlers({
    addHabit,
    navigate,
    push,
    setCompletionCount,
    advanceCompletionCount,
    setSelectedTags,
    habits: allHabits,
    setAddingTemplate,
    setFilter,
    today,
    handleDismissReminder: remindersHook.handleDismissReminder,
    updateHabit
  });

  // Sort by sortOrder so drag indices match the visual order on screen
  const habitsSortedByOrder = useMemo(
    () => [...allHabits].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [allHabits]
  );

  const { applyHabitsOrder } = useHabitOrderingCallbacks(updateHabit);
  const dragHandlers = useDragHandlers(habitsSortedByOrder, applyHabitsOrder);

  const daysSinceLastCompletion = getDaysSinceLastCompletion(activeHabits, todayDate);

  return {
    habits: allHabits,
    filtered: data.filtered,
    reminders: remindersHook.reminders,
    dropHint: dragHandlers.dropHint,
    dragOverHabitId: dragHandlers.dragOverHabitId,
    draggedHabitId: dragHandlers.draggedHabitId,
    filter,
    allTags: data.allTags,
    selectedTags,
    addingTemplate,
    today,
    todayRate: summary.todayRate,
    completedToday: summary.completedToday,
    totalActive: summary.totalActive,
    dateStr,
    overallStreak: data.overallStreak,
    searchQuery,
    setSearchQuery,
    setFilter: handlers.setFilter,
    setSelectedTags: handlers.setSelectedTags,
    toggleTag: handlers.toggleTag,
    navigate,
    handleExport: handlers.handleExport,
    handleTemplateSelect: handlers.handleTemplateSelect,
    handleToggle: handlers.handleToggle,
    handleDismissReminder: remindersHook.handleDismissReminder,
    handleDisableReminder: handlers.handleDisableReminder,
    handleDragStart: dragHandlers.handleDragStart,
    handleDragOver: dragHandlers.handleDragOver,
    handleDrop: dragHandlers.handleDrop,
    handleDragEnd: dragHandlers.handleDragEnd,
    handleTouchStart: dragHandlers.handleTouchStart,
    sortMode,
    setSortMode,
    viewDensity,
    setViewDensity,
    heroCollapsed,
    setHeroCollapsed,
    daysSinceLastCompletion
  };
}
