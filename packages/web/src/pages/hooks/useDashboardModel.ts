import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { getDaysSinceLastCompletion } from '@/lib/habits/habitStats';

import { useDashboardData } from './dashboard/useDashboardData';
import { useDashboardHandlers } from './dashboard/useDashboardHandlers';
import { useDragHandlers } from './dashboard/useDragHandlers';
import { useHabitOrderingCallbacks } from './dashboard/useHabitOrderingCallbacks';
import { useReminderTracker } from './dashboard/useReminderTracker';
import type { DashboardFilter } from './dashboard/useDashboardData';

const FILTER_STORAGE_KEY = 'hr_dashboard_filter_v1';

export function useDashboardModel() {
  const navigate = useNavigate();
  const { allHabits, setCompletionCount, addHabit, updateHabit, getTodayCompletionRate, formatDate } = useHabits();
  const { push } = useUndo();

  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'custom' | 'smart'>('custom');
  const [reorderMode, setReorderMode] = useState(false);

  const [filter, setFilter] = useState<DashboardFilter>(() => {
    if (typeof window === 'undefined') {
      return 'pending';
    }
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    const valid: DashboardFilter[] = ['all', 'pending', 'done', 'archived'];
    return (valid as string[]).includes(stored || '') ? (stored as DashboardFilter) : 'pending';
  });

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const today = formatDate(todayDate);
  const todayRate = getTodayCompletionRate();
  const activeHabits = useMemo(() => allHabits.filter(h => !h.archived), [allHabits]);
  const completedToday = activeHabits.filter((habit) => (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)).length;
  const totalActive = activeHabits.length;
  const dateStr = formatAppDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' });

  const remindersHook = useReminderTracker(activeHabits, formatDate, (habit) => {
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
    setSelectedTags,
    habits: allHabits,
    setAddingTemplate,
    setFilter,
    today,
    handleDismissReminder: remindersHook.handleDismissReminder
  });

  const { applyHabitsOrder, moveHabit } = useHabitOrderingCallbacks(allHabits, data.filtered, updateHabit);
  const dragHandlers = useDragHandlers(allHabits, applyHabitsOrder);

  const toggleReorderMode = useCallback(() => {
    setReorderMode((prev) => !prev);
  }, []);

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
    todayRate,
    completedToday,
    totalActive,
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
    handleDragStart: dragHandlers.handleDragStart,
    handleDragOver: dragHandlers.handleDragOver,
    handleDrop: dragHandlers.handleDrop,
    handleDragEnd: dragHandlers.handleDragEnd,
    reorderMode,
    toggleReorderMode,
    moveHabit,
    sortMode,
    setSortMode,
    daysSinceLastCompletion
  };
}
