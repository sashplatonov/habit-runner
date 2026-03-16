import React, { useCallback, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { HABIT_COLOR_THEMES } from '@/lib/theme/habit-colors';
import { useNavigate, useParams } from '@/lib/router';
import { useUndo } from '@/lib/undo';
import { HabitDetailView } from './components/HabitDetailView';

export function HabitDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const habitId = params.id;
  const { allHabits, setCompletionCount, getHabitStats, deleteHabit, restoreHabit, updateHabit, formatDate } = useHabits();
  const { push } = useUndo();
  const habit = habitId ? allHabits.find((h) => h.id === habitId) : undefined;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayFormatted = formatDate(new Date());
  const todayDateKey = todayFormatted.split('T')[0]; // Convert to YYYY-MM-DD format for server
  const isTodayFrozen = habit ? habit.freezeDays.includes(todayDateKey) : false;

  const handleDelete = useCallback(async () => {
    if (!habitId) {
      return;
    }
    const deleted = await deleteHabit(habitId);
    if (deleted) {
      push({
        message: `Habit "${deleted.name}" was deleted`,
        actionLabel: 'Restore',
        onUndo: async () => {
          await restoreHabit(deleted);
        }
      });
    }
    navigate('/');
  }, [deleteHabit, habitId, navigate, push, restoreHabit]);

  const handleToggleArchive = useCallback(() => {
    if (!habitId || !habit) {
      return;
    }
    updateHabit(habitId, { archived: !habit.archived });
  }, [habit, habitId, updateHabit]);

  const toggleFreezeToday = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const nextFreezeDays = isTodayFrozen
      ? habit.freezeDays.filter((date) => date !== todayDateKey)
      : [...habit.freezeDays, todayDateKey];
    await updateHabit(habitId, { freezeDays: nextFreezeDays });
  }, [habit, habitId, isTodayFrozen, todayDateKey, updateHabit]);

  const handleIncrementCompletion = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const previousCount = habit.completions[todayFormatted] ?? 0;
    const target = Math.max(1, habit.dailyTarget ?? 1);
    const nextCount = Math.min(target, previousCount + 1);
    await setCompletionCount(habitId, todayFormatted, nextCount);
    push({
      message: `Progress ${nextCount}/${target}: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await setCompletionCount(habitId, todayFormatted, previousCount);
      }
    });
  }, [habit, habitId, push, setCompletionCount, todayFormatted]);

  const handleDecrementCompletion = useCallback(async () => {
    if (!habitId || !habit) {
      return;
    }
    const previousCount = habit.completions[todayFormatted] ?? 0;
    if (previousCount <= 0) {
      return;
    }
    const nextCount = previousCount - 1;
    await setCompletionCount(habitId, todayFormatted, nextCount);
    push({
      message: nextCount > 0 ? `Completed ${nextCount}x today: ${habit.name}` : `Reset for today: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await setCompletionCount(habitId, todayFormatted, previousCount);
      }
    });
  }, [habit, habitId, push, setCompletionCount, todayFormatted]);

  if (!habit || !habitId) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-muted font-mono">Habit not found</div>
      </div>
    );
  }

  const stats = getHabitStats(habitId);
  const accent = HABIT_COLOR_THEMES[habit.color];
  const completedToday = (habit.completions[todayFormatted] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
  const todayCompletionCount = habit.completions[todayFormatted] ?? 0;

  return (
    <HabitDetailView
      habitId={habitId}
      habit={habit}
      stats={stats}
      accent={accent}
      completedToday={completedToday}
      todayCompletionCount={todayCompletionCount}
      confirmDelete={confirmDelete}
      isTodayFrozen={isTodayFrozen}
      navigate={navigate}
      setConfirmDelete={setConfirmDelete}
      handleToggleArchive={handleToggleArchive}
      handleIncrementCompletion={handleIncrementCompletion}
      handleDecrementCompletion={handleDecrementCompletion}
      setCompletionCount={setCompletionCount}
      toggleFreezeToday={toggleFreezeToday}
      handleDelete={handleDelete}
    />
  );
}
