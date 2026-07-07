import { get, writable, type Readable } from 'svelte/store';
import { nowSyncISO } from '@habbit-runner/shared';
import type { Habit, HabitStats } from '@/types/habit';
import {
  db,
  domainToHabitEntity,
  habitEntityToDomain,
  persistHabitInDb,
  removeHabitFromDb,
  deleteCheckinInDb,
  getCheckinByNaturalKey,
  getCurrentUserId,
  setCurrentUserId,
  type CheckinEntity,
  type HabitEntity
} from '$lib/storage/db';
import { createHabitsSnapshot, type HabitsSnapshot } from '$lib/stores/habits.snapshot';
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
import { dexieLiveQuery } from '$lib/stores/dexieLiveQuery';
import type { HabitResponseDto } from '@/types/habit-api';
import type { CheckinResponseDto } from '@/types/checkin-api';

type ToggleCompletionResult = { habitId: string; date: string; count: number };
type AdvanceCompletionResult = ToggleCompletionResult & { previousCount: number; target: number };
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

function mapHabitResponseToDomain(response: HabitResponseDto, existing?: Habit): Habit {
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

function mapCheckinResponseToEntity(response: CheckinResponseDto, userId: string): CheckinEntity {
  return {
    id: response.id,
    userId,
    habitId: response.habitId,
    date: response.date,
    done: response.done,
    count: response.count,
    updatedAt: response.updatedAt,
    version: response.version
  };
}

async function replaceCurrentUserState(
  userId: string,
  habitResponses: HabitResponseDto[],
  checkinResponses: CheckinResponseDto[]
): Promise<void> {
  await db.transaction('rw', db.habits, db.checkins, async () => {
    await db.habits.where({ userId }).delete();
    await db.checkins.where({ userId }).delete();
    const habits = habitResponses.map((response) => domainToHabitEntity(mapHabitResponseToDomain(response)));
    const checkins = checkinResponses.map((response) => mapCheckinResponseToEntity(response, userId));
    if (habits.length > 0) {
      await db.habits.bulkPut(habits);
    }
    if (checkins.length > 0) {
      await db.checkins.bulkPut(checkins);
    }
  });
}

async function refreshCurrentUserState(userId: string): Promise<void> {
  const [habitResponses, checkinResponses] = await Promise.all([
    fetchHabits(),
    fetchCheckins()
  ]);
  await replaceCurrentUserState(userId, habitResponses, checkinResponses);
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

async function getPersistedCompletionCount(
  habitId: string,
  date: string,
  userId: string
): Promise<number> {
  const existingCheckin = await getCheckinByNaturalKey(habitId, date, userId);
  if (!existingCheckin?.done) {
    return 0;
  }

  return Math.max(1, Math.trunc(existingCheckin.count ?? 1));
}

async function resolveHabitDailyTarget(
  habitId: string,
  allHabits: Habit[]
): Promise<number> {
  const entity = await db.habits.get(habitId);
  if (entity) {
    return Math.max(1, Math.trunc(entity.dailyTarget ?? 1));
  }

  const habit = allHabits.find((item) => item.id === habitId);
  return Math.max(1, Math.trunc(habit?.dailyTarget ?? 1));
}

async function applyCompletionCountChange(
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
    await db.checkins.put(mapCheckinResponseToEntity(response, getCurrentUserId()));
  } else {
    await deleteCheckinApi(habitId, date);
    await deleteCheckinInDb(habitId, date);
  }
  return { habitId, date, count: normalizedCount };
}

async function toggleCompletionImpl(
  habitId: string,
  date: string | undefined,
  userId: string
): Promise<ToggleCompletionResult> {
  const key = date || formatDate(new Date());
  const existingCheckin = await getCheckinByNaturalKey(habitId, key, userId);
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
  await persistHabitInDb(mapHabitResponseToDomain(response, newHabit));
  return newHabit.id;
}

async function updateHabitImpl(id: string, data: Partial<Habit>) {
  const entity = await db.habits.get(id);
  if (!entity) {
    return;
  }

  const existing = habitEntityToDomain(entity);
  const safeData = structuredClone(data) as Partial<Habit>;
  const updatedHabit: Habit = {
    ...existing,
    ...safeData,
    updatedAt: nowSyncISO(),
    version: (entity.version ?? 0) + 1
  };
  const changedKeys = Object.keys(safeData).filter((key) => safeData[key as keyof Habit] !== undefined);
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
  await persistHabitInDb(mapHabitResponseToDomain(response, updatedHabit));
}

async function toggleFreezeDayImpl(id: string, date: string): Promise<boolean | undefined> {
  const entity = await db.habits.get(id);
  if (!entity) {
    return undefined;
  }

  const existing = habitEntityToDomain(entity);
  const freezeKey = normalizeFreezeDayKey(date);
  const nextFreezeDays = new Set(existing.freezeDays ?? []);
  const willBeFrozen = !nextFreezeDays.has(freezeKey);
  if (willBeFrozen) {
    nextFreezeDays.add(freezeKey);
  } else {
    nextFreezeDays.delete(freezeKey);
  }

  const updatedHabit: Habit = {
    ...existing,
    freezeDays: Array.from(nextFreezeDays).sort(),
    updatedAt: nowSyncISO(),
    version: (entity.version ?? 0) + 1
  };
  const response = await updateHabitApi(id, {
    freezeDays: updatedHabit.freezeDays
  });
  await persistHabitInDb(mapHabitResponseToDomain(response, updatedHabit));
  return willBeFrozen;
}

async function deleteHabitImpl(id: string, allHabits: Habit[]) {
  const entity = await db.habits.get(id);
  const backup = allHabits.find((habit) => habit.id === id);
  if (!entity) {
    return backup;
  }

  await deleteHabitApi(id);
  await removeHabitFromDb(id);
  return backup;
}

async function restoreHabitImpl(habit: Habit) {
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
  await persistHabitInDb(mapHabitResponseToDomain(response, habit));
  const completionEntries = (Object.entries(habit.completions) as Array<[string, number]>)
    .filter(([, count]) => count > 0);
  for (const [date, count] of completionEntries) {
    const checkin = await upsertCheckinApi(habit.id, date, {
      done: true,
      count
    });
    await db.checkins.put(mapCheckinResponseToEntity(checkin, getCurrentUserId()));
  }
}

async function setCompletionCountImpl(
  habitId: string,
  date: string,
  count: number,
  allHabits: Habit[]
): Promise<ToggleCompletionResult> {
  const userId = getCurrentUserId();
  return runSerializedCompletionMutation(habitId, userId, async () => {
    const normalizedCount = Math.max(0, Math.trunc(count));
    const maxCount = await resolveHabitDailyTarget(habitId, allHabits);
    const clampedCount = Math.min(normalizedCount, maxCount);
    return applyCompletionCountChange(habitId, date, clampedCount);
  });
}

async function advanceCompletionCountImpl(
  habitId: string,
  date: string,
  allHabits: Habit[]
): Promise<AdvanceCompletionResult> {
  return incrementCompletionCountImpl(habitId, date, allHabits);
}

async function incrementCompletionCountImpl(
  habitId: string,
  date: string,
  allHabits: Habit[]
): Promise<AdvanceCompletionResult> {
  const userId = getCurrentUserId();
  return runSerializedCompletionMutation(habitId, userId, async () => {
    const target = await resolveHabitDailyTarget(habitId, allHabits);
    const previousCount = await getPersistedCompletionCount(habitId, date, userId);
    const nextCount = previousCount + 1;
    const result = await applyCompletionCountChange(habitId, date, nextCount);
    return {
      ...result,
      previousCount,
      target
    };
  });
}

export function createHabitsStore(initialUserId = getCurrentUserId()): HabitsStore {
  const store = writable<HabitsSnapshot>(createHabitsSnapshot([], []));
  let currentUserId = initialUserId;
  let latestHabitEntities: HabitEntity[] = [];
  let latestCheckinEntities: CheckinEntity[] = [];
  let stopHabitSubscription: () => void = () => undefined;
  let stopCheckinSubscription: () => void = () => undefined;

  function refreshSnapshot() {
    store.set(createHabitsSnapshot(latestHabitEntities, latestCheckinEntities));
  }

  function attachQueries() {
    stopHabitSubscription();
    stopCheckinSubscription();
    latestHabitEntities = [];
    latestCheckinEntities = [];
    refreshSnapshot();

    stopHabitSubscription = dexieLiveQuery(
      () => db.habits.where({ userId: currentUserId }).toArray(),
      [] as HabitEntity[]
    ).subscribe((entities) => {
      latestHabitEntities = entities ?? [];
      refreshSnapshot();
    });

    stopCheckinSubscription = dexieLiveQuery(
      () => db.checkins.where({ userId: currentUserId }).toArray(),
      [] as CheckinEntity[]
    ).subscribe((entities) => {
      latestCheckinEntities = entities ?? [];
      refreshSnapshot();
    });
  }

  setCurrentUserId(currentUserId);
  attachQueries();

  return {
    subscribe: store.subscribe,
    setUserId(userId: string) {
      currentUserId = userId;
      setCurrentUserId(userId);
      attachQueries();
      void refreshCurrentUserState(userId);
    },
    refresh() {
      return refreshCurrentUserState(currentUserId);
    },
    toggleCompletion(habitId: string, date?: string) {
      return toggleCompletionImpl(habitId, date, currentUserId);
    },
    setCompletionCount(habitId: string, date: string, count: number) {
      return setCompletionCountImpl(habitId, date, count, get(store).allHabits);
    },
    incrementCompletionCount(habitId: string, date: string) {
      return incrementCompletionCountImpl(habitId, date, get(store).allHabits);
    },
    advanceCompletionCount(habitId: string, date: string) {
      return advanceCompletionCountImpl(habitId, date, get(store).allHabits);
    },
    addHabit(data: HabitUpsertInput) {
      return addHabitImpl(data);
    },
    updateHabit(id: string, data: Partial<Habit>) {
      return updateHabitImpl(id, data);
    },
    toggleFreezeDay(id: string, date: string) {
      return toggleFreezeDayImpl(id, date);
    },
    deleteHabit(id: string) {
      return deleteHabitImpl(id, get(store).allHabits);
    },
    restoreHabit(habit: Habit) {
      return restoreHabitImpl(habit);
    },
    getHabitStats(habitId: string) {
      return getHabitStatsImpl(habitId, get(store).allHabits);
    },
    getTodayCompletionRate() {
      return getTodayCompletionRateImpl(get(store).habits);
    }
  };
}

export const habitsStore = createHabitsStore();
