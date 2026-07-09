import type { Habit } from '@/types/habit';
import type { HabitResponseDto } from '@/types/habit-api';
import type { CheckinResponseDto } from '@/types/checkin-api';
import { normalizeToCompletionKey } from '$lib/completionKey';

export type ToggleCompletionResult = { habitId: string; date: string; count: number };
export type AdvanceCompletionResult = ToggleCompletionResult & { previousCount: number; target: number };

export type CheckinState = {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  done: boolean;
  count?: number;
  updatedAt: string;
  version: number;
};

export function mapHabitResponseToDomain(response: HabitResponseDto, existing?: Habit): Habit {
  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    color: response.color,
    icon: response.icon,
    tags: response.tags ?? [],
    frequency: response.frequency,
    customDays: response.customDays,
    schedule: response.schedule ?? undefined,
    targetStreak: response.targetStreak,
    dailyTarget: response.dailyTarget,
    completions: existing?.completions ?? {},
    freezeDays: response.freezeDays ?? [],
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    version: response.version,
    archived: response.archived,
    sortOrder: response.sortOrder,
    type: response.type,
    reminderTime: response.reminderTime ?? undefined,
    reminderEnabled: response.reminderEnabled
  };
}

export function createCheckinEntity(
  response: Pick<CheckinResponseDto, 'id' | 'habitId' | 'date' | 'done' | 'count' | 'updatedAt' | 'version'>,
  userId: string
): CheckinState {
  return {
    id: response.id,
    userId,
    habitId: response.habitId,
    date: normalizeToCompletionKey(response.date),
    done: response.done,
    count: response.count,
    updatedAt: response.updatedAt,
    version: response.version
  };
}

export function replaceHabitInCollection(habits: Habit[], nextHabit: Habit): Habit[] {
  const existingIndex = habits.findIndex((habit) => habit.id === nextHabit.id);
  if (existingIndex === -1) {
    return [...habits, nextHabit];
  }

  const nextHabits = [...habits];
  nextHabits[existingIndex] = nextHabit;
  return nextHabits;
}

export function removeHabitFromCollection(habits: Habit[], habitId: string): Habit[] {
  return habits.filter((habit) => habit.id !== habitId);
}

export function replaceCheckinInCollection(
  checkins: CheckinState[],
  nextCheckin: CheckinState
): CheckinState[] {
  const existingIndex = checkins.findIndex((checkin) => checkin.id === nextCheckin.id);
  if (existingIndex === -1) {
    return [...checkins, nextCheckin];
  }

  const nextCheckins = [...checkins];
  nextCheckins[existingIndex] = nextCheckin;
  return nextCheckins;
}

export function removeCheckinFromCollection(
  checkins: CheckinState[],
  habitId: string,
  date: string,
  userId: string
): CheckinState[] {
  const normalizedDate = normalizeToCompletionKey(date);
  return checkins.filter((checkin) => (
    checkin.userId !== userId ||
    checkin.habitId !== habitId ||
    normalizeToCompletionKey(checkin.date) !== normalizedDate
  ));
}

export function findCheckin(
  checkins: CheckinState[],
  habitId: string,
  date: string,
  userId: string
): CheckinState | undefined {
  const normalizedDate = normalizeToCompletionKey(date);
  return checkins.find((checkin) => (
    checkin.userId === userId &&
    checkin.habitId === habitId &&
    normalizeToCompletionKey(checkin.date) === normalizedDate
  ));
}
