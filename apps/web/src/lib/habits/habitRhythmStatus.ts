import type { Habit } from '@/types/habit';

export type DayStatus = 'completed' | 'missed' | 'future' | 'frozen' | 'not-scheduled';
export type EditableDayStatus = 'completed' | 'missed' | 'frozen';

export type DayStatusMutation = {
  toggleFreeze: boolean;
  completionCount: number | null;
};

export function buildDayStatusMutation(
  habit: Habit,
  dateKey: string,
  status: EditableDayStatus
): DayStatusMutation {
  const isFrozen = habit.freezeDays?.includes(dateKey) ?? false;
  if (status === 'frozen') {
    return {
      toggleFreeze: !isFrozen,
      completionCount: null
    };
  }

  const target = Math.max(1, habit.dailyTarget ?? 1);
  const completedCount = habit.type === 'negative' ? 0 : target;
  const missedCount = habit.type === 'negative' ? target : 0;
  return {
    toggleFreeze: isFrozen,
    completionCount: status === 'completed' ? completedCount : missedCount
  };
}
