import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { getDaysSinceLastCompletion } from '@/lib/habits/habitStats';
import { isMandatoryToday } from '@/lib/habits/schedule';

import { useDashboardData } from './dashboard/useDashboardData';
import { useDashboardHandlers } from './dashboard/useDashboardHandlers';
import { useDragHandlers } from './dashboard/useDragHandlers';
import { useHabitOrderingCallbacks } from './dashboard/useHabitOrderingCallbacks';
import { useReminderTracker } from './dashboard/useReminderTracker';
import type { DashboardFilter } from './dashboard/useDashboardData';

const FILTER_STORAGE_KEY = 'hr_dashboard_filter_v1';
const DENSITY_STORAGE_KEY = 'hr_dashboard_density_v1';
const HERO_COLLAPSED_STORAGE_KEY = 'hr_dashboard_hero_collapsed_v1';

export function useDashboardModel() {
  const navigate = useNavigate();
  const { allHabits, setCompletionCount, addHabit, updateHabit, formatDate } = useHabits();
  const { push } = useUndo();

  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'custom' | 'smart'>('custom');

  const [filter, setFilter] = useState<DashboardFilter>(() => {
    if (typeof window === 'undefined') {
      return 'pending';
    }
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    const valid: DashboardFilter[] = ['all', 'pending', 'done', 'archived'];
    return (valid as string[]).includes(stored || '') ? (stored as DashboardFilter) : 'pending';
  });

  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window === 'undefined') {
      return 'comfortable';
    }
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
    return stored === 'compact' ? 'compact' : 'comfortable';
  });

  const [heroCollapsed, setHeroCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem(HERO_COLLAPSED_STORAGE_KEY) === '1';
  });

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

  // Only count habits mandatory for today (scheduled AND quota not met)
  const scheduledTodayHabits = useMemo(() => {
    return activeHabits.filter((habit) => isMandatoryToday(habit, todayDate));
  }, [activeHabits, todayDate]);

  const completedToday = scheduledTodayHabits.filter((habit) =>
    habit.type === 'negative'
      ? (habit.completions[today] ?? 0) === 0
      : (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;
  const totalActive = scheduledTodayHabits.length;
  const todayRate = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;
  const dateStr = formatAppDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' });

  const remindersHook = useReminderTracker(scheduledTodayHabits, formatDate, (habit) => {
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
