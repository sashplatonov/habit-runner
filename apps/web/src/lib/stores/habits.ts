import { get, writable, type Readable } from 'svelte/store';
import { nowSyncISO } from '@habbit-runner/shared';
import type { Habit, HabitStats } from '@/types/habit';
import {
  getCurrentUserId,
  setCurrentUserId
} from '$lib/storage/db';
import { createHabitsSnapshotFromDomain, type HabitsSnapshot } from '$lib/stores/habits.snapshot';
import {
  getHabitStats as getHabitStatsImpl,
  getTodayCompletionRate as getTodayCompletionRateImpl
} from '$lib/stores/habits.metrics';
import {
  fetchHabits,
  createHabit as createHabitApi,
  deleteHabit as deleteHabitApi,
  updateHabit as updateHabitApi,
  updateHabitStatus as updateHabitStatusApi
} from '$lib/api/habits';
import {
  deleteCheckin as deleteCheckinApi,
  fetchCheckins,
  upsertCheckin as upsertCheckinApi
} from '$lib/api/checkins';
import { createHabitId } from '$lib/core/habit-id';
import { formatDate } from '$lib/habits/habitStats';
import { completionKeyToCalendarDate } from '$lib/completionKey';
import type { HabitResponseDto } from '@/types/habit-api';
import type { CheckinResponseDto } from '@/types/checkin-api';
import {
  createCheckinEntity,
  findCheckin,
  mapHabitResponseToDomain,
  removeCheckinFromCollection,
  removeHabitFromCollection,
  replaceCheckinInCollection,
  replaceHabitInCollection,
  type AdvanceCompletionResult,
  type CheckinState,
  type ToggleCompletionResult
} from '$lib/stores/habits.storeHelpers';
export type HabitUpsertInput = Omit<Habit, 'id' | 'completions' | 'createdAt'> & { sortOrder?: number; reminderTime?: string | null };

export interface HabitsStore extends Readable<HabitsSnapshot> {
  setUserId: (userId: string) => void;
  refresh: () => Promise<void>;
  toggleCompletion: (habitId: string, date?: string) => Promise<ToggleCompletionResult>;
  setCompletionCount: (habitId: string, date: string, count: number) => Promise<ToggleCompletionResult>;
  incrementCompletionCount: (habitId: string, date: string) => Promise<AdvanceCompletionResult>;
  advanceCompletionCount: (habitId: string, date: string) => Promise<AdvanceCompletionResult>;
  addHabit: (data: HabitUpsertInput) => Promise<string>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  toggleFreezeDay: (id: string, date: string) => Promise<boolean | undefined>;
  deleteHabit: (id: string) => Promise<Habit | undefined>;
  restoreHabit: (habit: Habit) => Promise<void>;
  getHabitStats: (habitId: string) => HabitStats;
  getTodayCompletionRate: () => number;
}

const completionMutationQueue = new Map<string, Promise<unknown>>();

const normalizeFreezeDayKey = completionKeyToCalendarDate;

function getCompletionMutationKey(habitId: string, userId: string): string {
  return `${userId}:${habitId}`;
}

export async function runSerializedCompletionMutation<T>(
  habitId: string,
  userId: string,
  task: () => Promise<T>
): Promise<T> {
  const key = getCompletionMutationKey(habitId, userId);
  const previous = completionMutationQueue.get(key);
  const run = (previous ?? Promise.resolve())
    .catch(() => undefined)
    .then(task);
  completionMutationQueue.set(key, run);
  try {
    return await run;
  } finally {
    if (completionMutationQueue.get(key) === run) {
      completionMutationQueue.delete(key);
    }
  }
}

function createEmptySnapshot(): HabitsSnapshot {
  return createHabitsSnapshotFromDomain([], []);
}

async function getPersistedCompletionCount(
  habitId: string,
  date: string,
  userId: string,
  checkins: CheckinState[]
): Promise<number> {
  const existingCheckin = findCheckin(checkins, habitId, date, userId);
  if (!existingCheckin?.done) {
    return 0;
  }

  return Math.max(1, Math.trunc(existingCheckin.count ?? 1));
}

async function resolveHabitDailyTarget(
  habitId: string,
  allHabits: Habit[]
): Promise<number> {
  const habit = allHabits.find((item) => item.id === habitId);
  return Math.max(1, Math.trunc(habit?.dailyTarget ?? 1));
}

async function toggleCompletionImpl(
  habitId: string,
  date: string | undefined,
  userId: string,
  checkins: CheckinState[],
  applyCompletionCountChange: (habitId: string, date: string, count: number) => Promise<ToggleCompletionResult>
): Promise<ToggleCompletionResult> {
  const key = date || formatDate(new Date());
  const existingCheckin = findCheckin(checkins, habitId, key, userId);
  const currentCount = existingCheckin && existingCheckin.done
    ? Math.max(1, Math.trunc(existingCheckin.count ?? 1))
    : 0;
  const nextCount = currentCount > 0 ? 0 : 1;
  return await applyCompletionCountChange(habitId, key, nextCount);
}

async function addHabitImpl(data: HabitUpsertInput) {
  const safeData = structuredClone(data) as HabitUpsertInput;
  const now = nowSyncISO();
  const newHabit: Habit = {
    ...safeData,
    id: createHabitId(safeData.name),
    completions: {},
    dailyTarget: Math.max(1, Math.trunc(safeData.dailyTarget ?? 1)),
    createdAt: now,
    updatedAt: now,
    version: 1,
    sortOrder: safeData.sortOrder ?? Date.now(),
    reminderTime: safeData.reminderTime ?? undefined,
    reminderEnabled: safeData.reminderEnabled ?? true,
    archived: safeData.archived ?? false,
    freezeDays: safeData.freezeDays ?? []
  };
  const response = await createHabitApi({
    id: newHabit.id,
    name: newHabit.name,
    description: newHabit.description,
    color: newHabit.color,
    icon: newHabit.icon,
    frequency: newHabit.frequency,
    customDays: newHabit.customDays,
    schedule: newHabit.schedule,
    targetStreak: newHabit.targetStreak,
    dailyTarget: newHabit.dailyTarget,
    tags: newHabit.tags,
    archived: newHabit.archived,
    sortOrder: newHabit.sortOrder,
    reminderTime: newHabit.reminderTime ?? null,
    reminderEnabled: newHabit.reminderEnabled,
    type: newHabit.type,
    freezeDays: newHabit.freezeDays
  });
  return mapHabitResponseToDomain(response, newHabit);
}

function updateHabitImpl(data: Partial<Habit>) {
  const safeData = structuredClone(data) as Partial<Habit>;
  const changedKeys = Object.keys(safeData).filter((key) => safeData[key as keyof Habit] !== undefined);
  return { safeData, changedKeys };
}

function buildUpdatedHabit(existing: Habit, safeData: Partial<Habit>): Habit {
  return {
    ...existing,
    ...safeData,
    updatedAt: nowSyncISO(),
    version: (existing.version ?? 0) + 1
  };
}

function toggleFreezeDayImpl(existing: Habit, date: string): { willBeFrozen: boolean; updatedHabit: Habit } {
  const freezeKey = normalizeFreezeDayKey(date);
  const nextFreezeDays = new Set(existing.freezeDays ?? []);
  const willBeFrozen = !nextFreezeDays.has(freezeKey);
  if (willBeFrozen) {
    nextFreezeDays.add(freezeKey);
  } else {
    nextFreezeDays.delete(freezeKey);
  }

  return {
    willBeFrozen,
    updatedHabit: {
      ...existing,
      freezeDays: Array.from(nextFreezeDays).sort(),
      updatedAt: nowSyncISO(),
      version: (existing.version ?? 0) + 1
    }
  };
}

async function deleteHabitImpl(id: string, allHabits: Habit[]) {
  return allHabits.find((habit) => habit.id === id);
}

type HabitsStoreRuntime = {
  store: ReturnType<typeof writable<HabitsSnapshot>>;
  currentUserId: string;
  currentHabits: Habit[];
  currentCheckins: CheckinState[];
};

function refreshRuntimeSnapshot(runtime: HabitsStoreRuntime): void {
  runtime.store.set(createHabitsSnapshotFromDomain(runtime.currentHabits, runtime.currentCheckins));
}

function replaceRuntimeUserState(
  runtime: HabitsStoreRuntime,
  habitResponses: HabitResponseDto[],
  checkinResponses: CheckinResponseDto[]
): void {
  runtime.currentHabits = habitResponses.map((response) => mapHabitResponseToDomain(response));
  runtime.currentCheckins = checkinResponses.map((response) => createCheckinEntity(response, runtime.currentUserId));
  refreshRuntimeSnapshot(runtime);
}

async function refreshRuntimeFromBackend(runtime: HabitsStoreRuntime): Promise<void> {
  const [habitResponses, checkinResponses] = await Promise.all([
    fetchHabits(),
    fetchCheckins()
  ]);
  replaceRuntimeUserState(runtime, habitResponses, checkinResponses);
}

async function applyRuntimeCompletionCountChange(
  runtime: HabitsStoreRuntime,
  habitId: string,
  date: string,
  count: number
): Promise<ToggleCompletionResult> {
  const normalizedCount = Math.max(0, Math.trunc(count));
  if (normalizedCount > 0) {
    const response = await upsertCheckinApi(habitId, date, {
      done: true,
      count: normalizedCount
    });
    runtime.currentCheckins = replaceCheckinInCollection(
      runtime.currentCheckins,
      createCheckinEntity(response, runtime.currentUserId)
    );
  } else {
    await deleteCheckinApi(habitId, date);
    runtime.currentCheckins = removeCheckinFromCollection(
      runtime.currentCheckins,
      habitId,
      date,
      runtime.currentUserId
    );
  }
  refreshRuntimeSnapshot(runtime);
  return { habitId, date, count: normalizedCount };
}

function createMutationActions(runtime: HabitsStoreRuntime): Pick<
  HabitsStore,
  'setUserId' | 'refresh' | 'toggleCompletion' | 'setCompletionCount' | 'incrementCompletionCount' | 'advanceCompletionCount'
> {
  return {
    setUserId(userId: string) {
      runtime.currentUserId = userId;
      setCurrentUserId(userId);
      runtime.currentHabits = [];
      runtime.currentCheckins = [];
      refreshRuntimeSnapshot(runtime);
      void refreshRuntimeFromBackend(runtime);
    },
    refresh() {
      return refreshRuntimeFromBackend(runtime);
    },
    toggleCompletion(habitId: string, date?: string) {
      return toggleCompletionImpl(
        habitId,
        date,
        runtime.currentUserId,
        runtime.currentCheckins,
        (id, key, count) => applyRuntimeCompletionCountChange(runtime, id, key, count)
      );
    },
    setCompletionCount(habitId: string, date: string, count: number) {
      const allHabits = get(runtime.store).allHabits;
      return runSerializedCompletionMutation(habitId, runtime.currentUserId, async () => {
        const normalizedCount = Math.max(0, Math.trunc(count));
        const maxCount = await resolveHabitDailyTarget(habitId, allHabits);
        return applyRuntimeCompletionCountChange(runtime, habitId, date, Math.min(normalizedCount, maxCount));
      });
    },
    incrementCompletionCount(habitId: string, date: string) {
      const allHabits = get(runtime.store).allHabits;
      return runSerializedCompletionMutation(habitId, runtime.currentUserId, async () => {
        const target = await resolveHabitDailyTarget(habitId, allHabits);
        const previousCount = await getPersistedCompletionCount(
          habitId,
          date,
          runtime.currentUserId,
          runtime.currentCheckins
        );
        const result = await applyRuntimeCompletionCountChange(runtime, habitId, date, previousCount + 1);
        return { ...result, previousCount, target };
      });
    },
    advanceCompletionCount(habitId: string, date: string) {
      return this.incrementCompletionCount(habitId, date);
    }
  };
}

function createHabitCrudActions(runtime: HabitsStoreRuntime): Pick<
  HabitsStore,
  'addHabit' | 'updateHabit' | 'toggleFreezeDay' | 'deleteHabit' | 'restoreHabit'
> {
  return {
    async addHabit(data: HabitUpsertInput) {
      const createdHabit = await addHabitImpl(data);
      runtime.currentHabits = replaceHabitInCollection(runtime.currentHabits, createdHabit);
      refreshRuntimeSnapshot(runtime);
      return createdHabit.id;
    },
    async updateHabit(id: string, data: Partial<Habit>) {
      const existing = runtime.currentHabits.find((habit) => habit.id === id);
      if (!existing) {
        return;
      }

      const { safeData, changedKeys } = updateHabitImpl(data);
      const updatedHabit = buildUpdatedHabit(existing, safeData);
      const response = changedKeys.length === 1 && changedKeys[0] === 'archived'
        ? await updateHabitStatusApi(id, { archived: Boolean(safeData.archived) })
        : await updateHabitApi(id, {
            name: safeData.name,
            description: safeData.description,
            color: safeData.color,
            icon: safeData.icon,
            frequency: safeData.frequency,
            customDays: safeData.customDays,
            schedule: safeData.schedule,
            targetStreak: safeData.targetStreak,
            dailyTarget: safeData.dailyTarget,
            tags: safeData.tags,
            archived: safeData.archived,
            sortOrder: safeData.sortOrder,
            reminderTime: safeData.reminderTime ?? undefined,
            reminderEnabled: safeData.reminderEnabled,
            type: safeData.type,
            freezeDays: safeData.freezeDays
          });
      runtime.currentHabits = replaceHabitInCollection(
        runtime.currentHabits,
        mapHabitResponseToDomain(response, updatedHabit)
      );
      refreshRuntimeSnapshot(runtime);
    },
    async toggleFreezeDay(id: string, date: string) {
      const existing = runtime.currentHabits.find((habit) => habit.id === id);
      if (!existing) {
        return undefined;
      }

      const { willBeFrozen, updatedHabit } = toggleFreezeDayImpl(existing, date);
      const response = await updateHabitApi(id, { freezeDays: updatedHabit.freezeDays });
      runtime.currentHabits = replaceHabitInCollection(
        runtime.currentHabits,
        mapHabitResponseToDomain(response, updatedHabit)
      );
      refreshRuntimeSnapshot(runtime);
      return willBeFrozen;
    },
    async deleteHabit(id: string) {
      const backup = await deleteHabitImpl(id, get(runtime.store).allHabits);
      if (!backup) {
        return undefined;
      }

      await deleteHabitApi(id);
      runtime.currentHabits = removeHabitFromCollection(runtime.currentHabits, id);
      runtime.currentCheckins = runtime.currentCheckins.filter((checkin) => checkin.habitId !== id);
      refreshRuntimeSnapshot(runtime);
      return backup;
    },
    async restoreHabit(habit: Habit) {
      const response = await createHabitApi({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        icon: habit.icon,
        frequency: habit.frequency,
        customDays: habit.customDays,
        schedule: habit.schedule,
        targetStreak: habit.targetStreak,
        dailyTarget: habit.dailyTarget,
        tags: habit.tags,
        archived: habit.archived,
        sortOrder: habit.sortOrder,
        reminderTime: habit.reminderTime ?? null,
        reminderEnabled: habit.reminderEnabled ?? true,
        type: habit.type,
        freezeDays: habit.freezeDays
      });
      runtime.currentHabits = replaceHabitInCollection(runtime.currentHabits, mapHabitResponseToDomain(response, habit));

      const completionEntries = (Object.entries(habit.completions) as Array<[string, number]>)
        .filter(([, count]) => count > 0);
      for (const [date, count] of completionEntries) {
        const checkin = await upsertCheckinApi(habit.id, date, { done: true, count });
        runtime.currentCheckins = replaceCheckinInCollection(
          runtime.currentCheckins,
          createCheckinEntity(checkin, runtime.currentUserId)
        );
      }
      refreshRuntimeSnapshot(runtime);
    }
  };
}

function createHabitsStoreInternal(initialUserId = getCurrentUserId()): HabitsStore {
  const runtime: HabitsStoreRuntime = {
    store: writable<HabitsSnapshot>(createEmptySnapshot()),
    currentUserId: initialUserId,
    currentHabits: [],
    currentCheckins: []
  };

  setCurrentUserId(runtime.currentUserId);
  refreshRuntimeSnapshot(runtime);

  return {
    subscribe: runtime.store.subscribe,
    ...createMutationActions(runtime),
    ...createHabitCrudActions(runtime),
    getHabitStats(habitId: string) {
      return getHabitStatsImpl(habitId, get(runtime.store).allHabits);
    },
    getTodayCompletionRate() {
      return getTodayCompletionRateImpl(get(runtime.store).habits);
    }
  };
}

export function createHabitsStore(initialUserId = getCurrentUserId()): HabitsStore {
  return createHabitsStoreInternal(initialUserId);
}

export const habitsStore = createHabitsStore();
