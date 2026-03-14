import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Habit } from '@/types/habit';
import type { OnboardingTemplate } from '@/components/Onboarding';
import type { HabitUpsertInput } from '@/pages/hooks/useAddEditHabitModel';

export type UndoPushAction = {
  message: string;
  actionLabel: string;
  onUndo: () => void | Promise<void>;
};

export interface DashboardHandlersOptions {
  addHabit: (input: HabitUpsertInput) => Promise<string>;
  navigate: (to: string) => void;
  push: (action: UndoPushAction) => void;
  setCompletionCount: (habitId: string, date: string, count: number) => Promise<unknown>;
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  habits: Habit[];
  setAddingTemplate: Dispatch<SetStateAction<string | null>>;
  setFilter: Dispatch<SetStateAction<'all' | 'pending' | 'done' | 'archived'>>;
  today: string;
  handleDismissReminder: (habitId: string) => void;
}

export function useDashboardHandlers({
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
}: DashboardHandlersOptions) {
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
          dailyTarget: 1,
          difficulty: 1,
          type: 'positive',
          freezeDays: [],
          archived: false,
          sortOrder: habits.length > 0 ? Math.max(...habits.map((h) => h.sortOrder)) + 1 : 0
        });
        navigate(`/habit/${newId}`);
      } finally {
        setAddingTemplate(null);
      }
    },
    [addHabit, habits, navigate, setAddingTemplate]
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
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows: string[] = [];
    habits.forEach((habit) => {
      Object.entries(habit.completions).forEach(([date, count]) => {
        if (count > 0) {
          rows.push([date, escapeCsv(habit.name), '1'].join(','));
        }
      });
    });
    const csv = ['Date,Habit Name,Completed', ...rows].join('\n');
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
