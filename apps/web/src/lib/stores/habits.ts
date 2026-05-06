import { get, writable, type Readable } from 'svelte/store';
import { nowSyncISO } from '@habbit-runner/shared';
import type { Habit, HabitStats } from '@/types/habit';
import {
  db,
  habitEntityToDomain,
  persistHabitInDb,
  removeHabitFromDb,
  addTombstone,
  upsertCheckinInDb,
  deleteCheckinInDb,
  createOutboxEntry,
  enqueueOutboxEntry,
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
import { syncEntriesWithFallback } from '$lib/sync/writeThrough';
import { scheduleSyncCycle } from '$lib/sync/syncEngine';
import { createHabitId } from '$lib/core/habit-id';
import { formatDate } from '$lib/habits/habitStats';
import { completionKeyToCalendarDate } from '$lib/completionKey';
import { dexieLiveQuery } from '$lib/stores/dexieLiveQuery';

type ToggleCompletionResult = { habitId: string; date: string; count: number };
type AdvanceCompletionResult = ToggleCompletionResult & { previousCount: number; target: number };
export type HabitUpsertInput = Omit<Habit, 'id' | 'completions' | 'createdAt'> & { sortOrder?: number; reminderTime?: string | null };

export interface HabitsStore extends Readable<HabitsSnapshot> {
  setUserId: (userId: string) => void;
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
  let timestamp = nowSyncISO();
  let nextVersion = 1;
  let deletedEntity: CheckinEntity | undefined;

  await db.transaction('rw', db.checkins, db.habits, db.outbox, async () => {
    if (normalizedCount > 0) {
      timestamp = await upsertCheckinInDb(habitId, date, true, normalizedCount);
    } else {
      deletedEntity = await deleteCheckinInDb(habitId, date);
    }

    const entity = await db.habits.get(habitId);
    nextVersion = entity ? (entity.version ?? 0) + 1 : 1;
    if (entity) {
      const updatedHabit: Habit = {
        ...habitEntityToDomain(entity),
        updatedAt: timestamp,
        version: nextVersion
      };
      await persistHabitInDb(updatedHabit);
    }

    const payload = normalizedCount === 0
      ? { habitId, date, updatedAt: timestamp, id: deletedEntity?.id }
      : { habitId, date, done: true, count: normalizedCount, updatedAt: timestamp, version: nextVersion };
    const entry = createOutboxEntry('checkin', normalizedCount === 0 ? 'delete' : 'upsert', payload);
    await enqueueOutboxEntry(entry);
  });

  scheduleSyncCycle();
  return { habitId, date, count: normalizedCount };
}

async function persistHabitWithSyncFallback(habit: Habit, action: 'upsert' | 'delete') {
  if (action === 'delete') {
    await removeHabitFromDb(habit.id);
  } else {
    await persistHabitInDb(habit);
  }

  const entry = createOutboxEntry('habit', action, habit as unknown as Record<string, unknown>);
  // Sync failure is non-fatal: data is already persisted in IndexedDB above.
  // The background sync engine will pick it up on the next cycle.
  try {
    await syncEntriesWithFallback([entry]);
  } catch {
    // ignore
  }
}

async function updateHabitAfterCheckinChange(habitId: string, timestamp: string) {
  const entity = await db.habits.get(habitId);
  if (entity) {
    const updatedHabit: Habit = {
      ...habitEntityToDomain(entity),
      updatedAt: timestamp,
      version: (entity.version ?? 0) + 1
    };
    await persistHabitInDb(updatedHabit);
  }

  return entity;
}

function buildToggleCompletionPayload(params: {
  habitId: string;
  date: string;
  nextCount: number;
  timestamp: string;
  version?: number;
  deletedEntityId?: string;
}) {
  const { habitId, date, nextCount, timestamp, version, deletedEntityId } = params;
  if (nextCount === 0) {
    return { habitId, date, updatedAt: timestamp, id: deletedEntityId };
  }

  return {
    habitId,
    date,
    done: true,
    count: nextCount,
    updatedAt: timestamp,
    version: version ?? 1
  };
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

  let timestamp = nowSyncISO();
  let deletedEntity;
  if (nextCount > 0) {
    timestamp = await upsertCheckinInDb(habitId, key, true, nextCount);
  } else {
    deletedEntity = await deleteCheckinInDb(habitId, key);
  }

  const entity = await updateHabitAfterCheckinChange(habitId, timestamp);
  const payload = buildToggleCompletionPayload({
    habitId,
    date: key,
    nextCount,
    timestamp,
    version: entity?.version,
    deletedEntityId: deletedEntity?.id
  });
  const entry = createOutboxEntry('checkin', nextCount === 0 ? 'delete' : 'upsert', payload);
  await syncEntriesWithFallback([entry]);

  return { habitId, date: key, count: nextCount };
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
  await persistHabitWithSyncFallback(newHabit, 'upsert');
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
  await persistHabitWithSyncFallback(updatedHabit, 'upsert');
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
  await persistHabitWithSyncFallback(updatedHabit, 'upsert');
  return willBeFrozen;
}

async function deleteHabitImpl(id: string, allHabits: Habit[]) {
  const entity = await db.habits.get(id);
  const backup = allHabits.find((habit) => habit.id === id);
  if (!entity) {
    return backup;
  }

  const version = entity.version ?? 1;
  await addTombstone('habit', id, version);
  await removeHabitFromDb(id);
  const entry = createOutboxEntry('habit', 'delete', { id, version });
  await syncEntriesWithFallback([entry]);
  return backup;
}

async function restoreHabitImpl(habit: Habit) {
  await persistHabitInDb(habit);
  await db.tombstones.where({ entity: 'habit', entityId: habit.id }).delete();
  const entries = [createOutboxEntry('habit', 'upsert', habit as unknown as Record<string, unknown>)];
  const completionEntries = (Object.entries(habit.completions) as Array<[string, number]>)
    .filter(([, count]) => count > 0);
  for (const [date, count] of completionEntries) {
    const timestamp = await upsertCheckinInDb(habit.id, date, true, count);
    entries.push(createOutboxEntry('checkin', 'upsert', {
      habitId: habit.id,
      date,
      done: true,
      count,
      updatedAt: timestamp,
      version: habit.version
    }));
  }
  await syncEntriesWithFallback(entries);
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
