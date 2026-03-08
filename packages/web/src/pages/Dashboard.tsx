import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useNavigate } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { formatAppDate } from '@/lib/i18n';
import type { Habit } from '@/types/habit';
import type { OnboardingTemplate } from '@/components/Onboarding';
import { DashboardView } from './components/DashboardView';

type Reminder = {
  habitId: string;
  time: string;
  message: string;
};

const parseReminderMinutes = (value: string): number | null => {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, setCompletionCount, addHabit, updateHabit, getTodayCompletionRate, formatDate } = useHabits();
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ habitId: string; position: 'above' | 'below' } | null>(null);
  const reminderTracker = useRef<Record<string, string>>({});
  const reminderLastCheckRef = useRef<number | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const sendBrowserNotification = useCallback((habit: Habit) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification('Habbit reminder', {
        body: `Time for: ${habit.name}`,
        tag: `habit-reminder-${habit.id}`
      });
    } catch {
      // Ignore browsers that block notifications at runtime.
    }
  }, []);

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

  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, habitId: string) => {
    event.dataTransfer?.setData('text/plain', habitId);
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
    setDraggedHabitId(habitId);
    setDropHint(null);
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>, habitId: string) => {
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
    async (event: React.DragEvent<HTMLDivElement>, habitId: string) => {
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
        if (!habit.reminderTime || habit.archived || habit.reminderEnabled === false) {return;}
        if (reminderTracker.current[habit.id] === nowDayKey) {return;}

        const reminderMinutes = parseReminderMinutes(habit.reminderTime);
        if (reminderMinutes === null) {return;}

        const crossedReminderTime =
          previousDayKey === nowDayKey
            ? reminderMinutes > previousMinutes && reminderMinutes <= nowMinutes
            : nowMinutes >= reminderMinutes;

        if (!crossedReminderTime) {return;}

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
        sendBrowserNotification(habit);
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
  }, [formatDate, habits, sendBrowserNotification]);

  useEffect(() => {
    setReminders((prev) => prev.filter((reminder) => habits.some((habit) => habit.id === reminder.habitId)));
  }, [habits]);

  const handleDismissReminder = useCallback((habitId: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.habitId !== habitId));
  }, []);

  const { push } = useUndo();
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);

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
    [addHabit, navigate]
  );

  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const today = formatDate(new Date());
  const todayRate = getTodayCompletionRate();
  const completedToday = habits.filter((h) => (h.completions[today] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)).length;
  const totalActive = habits.length;
  const dateStr = formatAppDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    habits.forEach((habit) => {
      habit.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [habits]);

  const filtered = useMemo(() => {
    return habits.filter((h) => {
      if (filter === 'pending') {
        return (h.completions[today] ?? 0) < Math.max(1, h.dailyTarget ?? 1);
      }
      if (filter === 'done') {
        return (h.completions[today] ?? 0) >= Math.max(1, h.dailyTarget ?? 1);
      }
      if (selectedTags.length > 0 && !selectedTags.some((tag) => h.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  }, [habits, filter, selectedTags, today]);

  const handleToggle = useCallback(
    async (habit: Habit) => {
      const target = Math.max(1, habit.dailyTarget ?? 1);
      const previousCount = habit.completions[today] ?? 0;
      const nextCount = previousCount >= target ? 0 : previousCount + 1;
      await setCompletionCount(habit.id, today, nextCount);
      push({
        message: nextCount >= target ? `Done: ${habit.name} (${nextCount}/${target})` : `Progress: ${habit.name} (${nextCount}/${target})`,
        actionLabel: 'Undo',
        onUndo: async () => {
          await setCompletionCount(habit.id, today, previousCount);
        }
      });
      handleDismissReminder(habit.id);
    },
    [push, setCompletionCount, today, handleDismissReminder]
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

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }, []);

  let overallStreak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 30; i++) {
    const key = d.toISOString().split('T')[0];
    const allDone = habits.every((h) => (h.completions[key] ?? 0) >= Math.max(1, h.dailyTarget ?? 1));
    if (allDone) {
      overallStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <DashboardView
      habits={habits}
      filtered={filtered}
      reminders={reminders}
      dropHint={dropHint}
      dragOverHabitId={dragOverHabitId}
      filter={filter}
      allTags={allTags}
      selectedTags={selectedTags}
      addingTemplate={addingTemplate}
      today={today}
      todayRate={todayRate}
      completedToday={completedToday}
      totalActive={totalActive}
      dateStr={dateStr}
      overallStreak={overallStreak}
      setFilter={setFilter}
      setSelectedTags={setSelectedTags}
      toggleTag={toggleTag}
      navigate={navigate}
      handleExport={handleExport}
      handleTemplateSelect={handleTemplateSelect}
      handleToggle={handleToggle}
      handleDismissReminder={handleDismissReminder}
      handleDragStart={handleDragStart}
      handleDragOver={handleDragOver}
      handleDrop={handleDrop}
      handleDragEnd={handleDragEnd}
    />
  );
}
