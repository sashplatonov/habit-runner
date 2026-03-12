import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, DragEvent, SetStateAction } from 'react';
import { useNavigate } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import type { Habit } from '@/types/habit';
import type { OnboardingTemplate } from '@/components/Onboarding';
import type { HabitUpsertInput } from '@/pages/hooks/useAddEditHabitModel';
import { isScheduledForDate, resolveHabitSchedule } from '@/lib/habits/schedule';

type UndoPushAction = {
  message: string;
  actionLabel: string;
  onUndo: () => void | Promise<void>;
};

export function useDashboardModel() {
  const navigate = useNavigate();
  const { habits, setCompletionCount, addHabit, updateHabit, getTodayCompletionRate, formatDate } = useHabits();
  const { push } = useUndo();
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const today = formatDate(todayDate);
  const todayKey = today;
  const todayRate = getTodayCompletionRate();
  const completedToday = habits.filter((habit) => (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)).length;
  const totalActive = habits.length;
  const dateStr = formatAppDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' });

  const remindersHook = useReminderTracker(habits, formatDate, (habit) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification('Habbit reminder', {
        body: `Time for: ${habit.name}`,
        tag: `habit-reminder-${habit.id}`
      });
    } catch {
      // ignore notifications that fail
    }
  });

  const dragHandlers = useDragHandlers(habits, updateHabit);
  const data = useDashboardData(habits, filter, selectedTags, todayDate, todayKey);
  const handlers = useDashboardHandlers({
    addHabit,
    navigate,
    push,
    setCompletionCount,
    setSelectedTags,
    habits,
    setAddingTemplate,
    setFilter,
    today,
    handleDismissReminder: remindersHook.handleDismissReminder
  });

  const allTags = data.allTags;
  const filtered = data.filtered;
  const overallStreak = data.overallStreak;

  return {
    habits,
    filtered,
    reminders: remindersHook.reminders,
    dropHint: dragHandlers.dropHint,
    dragOverHabitId: dragHandlers.dragOverHabitId,
    filter,
    allTags,
    selectedTags,
    addingTemplate,
    today,
    todayRate,
    completedToday,
    totalActive,
    dateStr,
    overallStreak,
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
    handleDragEnd: dragHandlers.handleDragEnd
  };
}

function useDashboardData(
  habits: Habit[],
  filter: 'all' | 'pending' | 'done',
  selectedTags: string[],
  today: Date,
  todayKey: string
) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    habits.forEach((habit) => habit.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [habits]);

  const filtered = useMemo(
    () =>
      habits.filter((habit) => {
        if (selectedTags.length > 0 && !selectedTags.some((tag) => habit.tags.includes(tag))) {
          return false;
        }
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
      }),
    [habits, filter, selectedTags, today, todayKey]
  );

  const overallStreak = useMemo(() => {
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
  }, [habits]);

  return { allTags, filtered, overallStreak };
}

function useDashboardHandlers({
  addHabit,
  navigate,
  push,
  setCompletionCount,
  setSelectedTags,
  habits,
  setAddingTemplate,
  setFilter,
  today,
  handleDismissReminder
}: {
  addHabit: (input: HabitUpsertInput) => Promise<string>;
  navigate: (to: string) => void;
  push: (action: UndoPushAction) => void;
  setCompletionCount: (habitId: string, date: string, count: number) => Promise<void>;
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  habits: Habit[];
  setAddingTemplate: Dispatch<SetStateAction<string | null>>;
  setFilter: Dispatch<SetStateAction<'all' | 'pending' | 'done'>>;
  today: string;
  handleDismissReminder: (habitId: string) => void;
}) {
  const toggleTag = useCallback(
    (tag: string) => {
      setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
    },
    [setSelectedTags]
  );

  const handleTemplateSelect = useCallback(
    async (template: OnboardingTemplate) => {
      setAddingTemplate(template.name);
      try {
        const newId = await addHabit({
          name: template.name,
          description: template.description,
          icon: template.icon,
          color: template.color,
          tags: template.tags,
          frequency: template.frequency,
          customDays: template.customDays,
          targetStreak: template.targetStreak,
          dailyTarget: 1
        });
        navigate(`/habit/${newId}`);
      } finally {
        setAddingTemplate(null);
      }
    },
    [addHabit, navigate, setAddingTemplate]
  );

  const handleToggle = useCallback(
    async (habit: Habit) => {
      const target = Math.max(1, habit.dailyTarget ?? 1);
      const previousCount = habit.completions[today] ?? 0;
      const nextCount = previousCount >= target ? 0 : previousCount + 1;
      await setCompletionCount(habit.id, today, nextCount);
      push({
        message:
          nextCount >= target
            ? `Done: ${habit.name} (${nextCount}/${target})`
            : `Progress: ${habit.name} (${nextCount}/${target})`,
        actionLabel: 'Undo',
        onUndo: async () => {
          await setCompletionCount(habit.id, today, previousCount);
        }
      });
      handleDismissReminder(habit.id);
    },
    [handleDismissReminder, push, setCompletionCount, today]
  );

  const handleExport = useCallback(() => {
    if (typeof document === 'undefined' || habits.length === 0) {
      return;
    }
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = habits.map((habit) => {
      const completionDates = Object.entries(habit.completions)
        .filter(([, count]) => count > 0)
        .map(([date, count]) => ({ date, count }));
      return [
        escape(habit.name),
        escape(habit.description),
        escape(habit.tags.join('|')),
        escape(JSON.stringify(completionDates))
      ].join(',');
    });
    const csv = ['name,description,tags,completions', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habits-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [habits]);

  return {
    handleTemplateSelect,
    handleToggle,
    handleExport,
    toggleTag,
    setFilter,
    setSelectedTags
  };
}

function useDragHandlers(habits: Habit[], updateHabit: (id: string, data: Partial<Habit>) => Promise<void>) {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ habitId: string; position: 'above' | 'below' } | null>(null);

  const applySortOrder = useCallback(
    async (orderedHabits: Habit[]) => {
      await Promise.all(
        orderedHabits.map((habit, index) => {
          const targetOrder = index;
          if (habit.sortOrder === targetOrder) {
            return Promise.resolve();
          }
          return updateHabit(habit.id, { sortOrder: targetOrder });
        })
      );
    },
    [updateHabit]
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, habitId: string) => {
    event.dataTransfer?.setData('text/plain', habitId);
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
    setDraggedHabitId(habitId);
    setDropHint(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, habitId: string) => {
      event.preventDefault();
      if (!draggedHabitId || draggedHabitId === habitId) {
        setDropHint(null);
        setDragOverHabitId(null);
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const midpoint = bounds.top + bounds.height / 2;
      const position = event.clientY < midpoint ? 'above' : 'below';
      setDropHint({ habitId, position });
      setDragOverHabitId(habitId);
    },
    [draggedHabitId]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>, habitId: string) => {
      event.preventDefault();
      if (!draggedHabitId || draggedHabitId === habitId) {
        setDragOverHabitId(null);
        setDraggedHabitId(null);
        return;
      }

      const original = [...habits];
      const sourceIndex = original.findIndex((habit) => habit.id === draggedHabitId);
      const targetIndex = original.findIndex((habit) => habit.id === habitId);
      if (sourceIndex === -1 || targetIndex === -1) {
        setDragOverHabitId(null);
        setDraggedHabitId(null);
        return;
      }

      const position =
        dropHint?.habitId === habitId
          ? dropHint.position
          : (() => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const midpoint = bounds.top + bounds.height / 2;
              return event.clientY < midpoint ? 'above' : 'below';
            })();

      const ordered = [...original];
      const [moved] = ordered.splice(sourceIndex, 1);
      let insertIndex = targetIndex + (position === 'below' ? 1 : 0);
      if (sourceIndex < insertIndex) {
        insertIndex = Math.max(0, insertIndex - 1);
      }
      insertIndex = Math.max(0, Math.min(ordered.length, insertIndex));
      ordered.splice(insertIndex, 0, moved);
      await applySortOrder(ordered);

      setDragOverHabitId(null);
      setDraggedHabitId(null);
      setDropHint(null);
    },
    [applySortOrder, draggedHabitId, habits, dropHint]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
    setDropHint(null);
  }, []);

  return {
    dropHint,
    dragOverHabitId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
}

function useReminderTracker(
  habits: Habit[],
  formatDate: (date: Date) => string,
  notify: (habit: Habit) => void
) {
  const reminderTracker = useRef<Record<string, string>>({});
  const reminderLastCheckRef = useRef<number | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleDismissReminder = useCallback((habitId: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.habitId !== habitId));
  }, []);

  useEffect(() => {
    setReminders((prev) => prev.filter((reminder) => habits.some((habit) => habit.id === reminder.habitId)));
  }, [habits]);

  useEffect(() => {
    const checkReminders = () => {
      const nowTs = Date.now();
      const now = new Date(nowTs);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const nowDayKey = formatDate(now);
      const previousTs = reminderLastCheckRef.current ?? nowTs;
      reminderLastCheckRef.current = nowTs;
      const previous = new Date(previousTs);
      const previousMinutes = previous.getHours() * 60 + previous.getMinutes();
      const previousDayKey = formatDate(previous);

      habits.forEach((habit) => {
        if (!habit.reminderTime || habit.archived || habit.reminderEnabled === false) {
          return;
        }
        if (reminderTracker.current[habit.id] === nowDayKey) {
          return;
        }

        const reminderMinutes = parseReminderMinutes(habit.reminderTime);
        if (reminderMinutes === null) {
          return;
        }

        const crossedReminderTime =
          previousDayKey === nowDayKey
            ? reminderMinutes > previousMinutes && reminderMinutes <= nowMinutes
            : nowMinutes >= reminderMinutes;

        if (!crossedReminderTime) {
          return;
        }

        reminderTracker.current[habit.id] = nowDayKey;
        setReminders((prev) =>
          prev.some((item) => item.habitId === habit.id)
            ? prev
            : [
                ...prev,
                {
                  habitId: habit.id,
                  time: habit.reminderTime,
                  message: `Reminder: ${habit.name} (${habit.reminderTime})`
                }
              ]
        );
        notify(habit);
      });
    };

    checkReminders();
    if (typeof window === 'undefined') {
      return;
    }

    const interval = window.setInterval(checkReminders, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [formatDate, habits, notify]);

  return {
    reminders,
    handleDismissReminder
  };
}

function parseReminderMinutes(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

interface Reminder {
  habitId: string;
  time: string;
  message: string;
}
