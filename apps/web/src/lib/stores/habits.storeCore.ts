import type { Habit } from '@/types/habit';
import { nowSyncISO } from '@habbit-runner/shared';
import { createHabitId } from '$lib/core/habit-id';
import { normalizeToCompletionKey } from '$lib/completionKey';
import type { CheckinState, ToggleCompletionResult } from '$lib/stores/habits.storeHelpers';
import type { HabitUpdateInput, HabitUpsertInput } from '$lib/stores/habits';

export type HabitRuntimeState = { habits: Habit[]; checkins: CheckinState[] };

export function cloneRuntimeState(state: HabitRuntimeState): HabitRuntimeState {
  return structuredClone(state) as HabitRuntimeState;
}

export function createHabitFromInput(data: HabitUpsertInput): Habit {
  const now = nowSyncISO();
  return {
    ...structuredClone(data),
    id: createHabitId(data.name),
    completions: {},
    createdAt: now,
    updatedAt: now,
    version: 1,
    dailyTarget: Math.max(1, Math.trunc(data.dailyTarget ?? 1)),
    sortOrder: data.sortOrder ?? Date.now(),
    reminderTime: data.reminderTime ?? undefined,
    reminderEnabled: data.reminderEnabled ?? true,
    archived: data.archived ?? false,
    freezeDays: data.freezeDays ?? []
  };
}

export function updateHabitInState(state: HabitRuntimeState, id: string, data: HabitUpdateInput): void {
  const index = state.habits.findIndex((habit) => habit.id === id);
  if (index < 0) {
    return;
  }
  const current = state.habits[index];
  const { reminderTime, ...rest } = structuredClone(data) as HabitUpdateInput;
  state.habits[index] = {
    ...current,
    ...rest,
    ...(Object.hasOwn(data, 'reminderTime') ? { reminderTime: reminderTime ?? undefined } : {}),
    dailyTarget: Math.max(1, Math.trunc(data.dailyTarget ?? current.dailyTarget)),
    updatedAt: nowSyncISO(),
    version: (current.version ?? 0) + 1
  };
}

export function setCompletionCountInState(state: HabitRuntimeState, habitId: string, date: string, count: number): ToggleCompletionResult {
  const normalizedDate = normalizeToCompletionKey(date);
  const normalizedCount = Math.max(0, Math.trunc(count));
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) {
    return { habitId, date: normalizedDate, count: 0 };
  }
  const boundedCount = Math.min(normalizedCount, Math.max(1, habit.dailyTarget));
  const existing = state.checkins.find((checkin) => checkin.habitId === habitId && checkin.date === normalizedDate);
  if (boundedCount === 0) {
    state.checkins = state.checkins.filter((checkin) => checkin !== existing);
  } else if (existing) {
    existing.done = true;
    existing.count = boundedCount;
    existing.updatedAt = nowSyncISO();
  } else {
    state.checkins = [...state.checkins, {
      id: `${habitId}-${normalizedDate}`,
      userId: 'showcase-demo',
      habitId,
      date: normalizedDate,
      done: true,
      count: boundedCount,
      updatedAt: nowSyncISO(),
      version: 1
    }];
  }
  return { habitId, date: normalizedDate, count: boundedCount };
}

export function toggleFreezeDayInState(state: HabitRuntimeState, id: string, date: string): boolean | undefined {
  const habit = state.habits.find((item) => item.id === id);
  if (!habit) {
    return undefined;
  }
  const key = date.slice(0, 10);
  const frozen = new Set(habit.freezeDays ?? []);
  const willBeFrozen = !frozen.has(key);
  if (willBeFrozen) {
    frozen.add(key);
  } else {
    frozen.delete(key);
  }
  updateHabitInState(state, id, { freezeDays: Array.from(frozen).sort() });
  return willBeFrozen;
}
