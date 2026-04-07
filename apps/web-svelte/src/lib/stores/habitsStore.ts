import { derived } from 'svelte/store';
import type { Habit, HabitStats } from '$lib/types/habit';
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
  getCurrentUserId,
  type HabitEntity
} from '$lib/storage/db';
import { nowSyncISO } from '@habbit-runner/shared';
import { syncEntriesWithFallback } from '$lib/sync/writeThrough';
import { scheduleSyncCycle } from '$lib/sync/syncEngine';
import { createHabitId } from '$lib/core/habit-id';
import {
  buildMonthlyCompletionRates,
  buildWeeklyCompletionData,
  countCompletedDays,
  formatDate
} from '$lib/habits/habitStats';
import { calculateScheduledCompletionRate, calculateScheduledStreak, calculateAutomatismScore } from '$lib/habits/schedule';
import { liveQueryStore } from '$lib/stores/liveQuery';
import { buildCompletionsByHabitId } from '$lib/habits/helpers';
import { completionKeyToCalendarDate } from '$lib/completionKey';

type ToggleCompletionResult = {
  habitId: string;
  date: string;
  count: number;
};

type AdvanceCompletionResult = ToggleCompletionResult & {
  previousCount: number;
  target: number;
};

export type HabitUpsertInput = Omit<Habit, 'id' | 'completions' | 'createdAt'> & {
  sortOrder?: number;
  reminderTime?: string | null;
};

const completionMutationQueue = new Map<string, Promise<unknown>>();

const normalizeFreezeDayKey = completionKeyToCalendarDate;

function applyFreezeDays(
  baseCompletions: Record<string, number>,
  freezeDays: string[] | undefined,
  dailyTarget: number
) {
  (freezeDays ?? []).forEach((date) => {
    const completionKey = date.includes('T') ? date : `${date}T00:00:00Z`;
    const existing = baseCompletions[completionKey] ?? 0;
    baseCompletions[completionKey] = Math.max(dailyTarget, existing);
  });
}

function buildHabitFromEntity(
  entity: Parameters<typeof habitEntityToDomain>[0],
  completionsByHabitId: Record<string, Record<string, number>>
): Habit {
  const domain = habitEntityToDomain(entity);
  const dailyTarget = Math.max(1, domain.dailyTarget ?? 1);
  const completions = { ...(completionsByHabitId[domain.id] ?? {}) };
  applyFreezeDays(completions, domain.freezeDays, dailyTarget);
  return {
    ...domain,
    completions
  };
}

function mapHabits(
  entities: Parameters<typeof habitEntityToDomain>[0][],
  completionsByHabitId: Record<string, Record<string, number>>
) {
  return entities.map((entity) => buildHabitFromEntity(entity, completionsByHabitId));
}

function sortHabitsByOrder(habits: Habit[]) {
  const sorted = [...habits];
  return sorted.sort((a, b) => {
    const first = a.sortOrder ?? 0;
    const second = b.sortOrder ?? 0;
    if (first !== second) {
      return first - second;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

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
  const existingCheckin = await db.checkins
    .where('habitId')
    .equals(habitId)
    .filter((record) => record.date === date && record.userId === userId && record.done)
    .first();
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
  let ts = nowSyncISO();
  let nextVersion = 1;
  let deletedEntity;

  await db.transaction('rw', db.checkins, db.habits, db.outbox, async () => {
    if (normalizedCount > 0) {
      ts = await upsertCheckinInDb(habitId, date, true, normalizedCount);
    } else {
      deletedEntity = await deleteCheckinInDb(habitId, date);
    }

    const entity = await db.habits.get(habitId);
    nextVersion = entity ? (entity.version ?? 0) + 1 : 1;
    if (entity) {
      const updatedHabit: Habit = {
        ...habitEntityToDomain(entity),
        updatedAt: ts,
        version: nextVersion
      };
      await persistHabitInDb(updatedHabit);
    }

    const payload = normalizedCount === 0
      ? { habitId, date, updatedAt: ts, id: deletedEntity?.id }
      : { habitId, date, done: true, count: normalizedCount, updatedAt: ts, version: nextVersion };
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
  await syncEntriesWithFallback([entry]);
}

async function toggleCompletionImpl(
  habitId: string,
  date: string | undefined,
  userId: string
): Promise<ToggleCompletionResult> {
  const key = date || formatDate(new Date());
  const existingCheckin = await db.checkins
    .where('habitId')
    .equals(habitId)
    .filter((record) => record.date === key && record.userId === userId && record.done)
    .first();
  const currentCount = existingCheckin && existingCheckin.done
    ? Math.max(1, Math.trunc(existingCheckin.count ?? 1))
    : 0;
  const nextCount = currentCount > 0 ? 0 : 1;

  let ts = nowSyncISO();
  let deletedEntity;
  if (nextCount > 0) {
    ts = await upsertCheckinInDb(habitId, key, true, nextCount);
  } else {
    deletedEntity = await deleteCheckinInDb(habitId, key);
  }

  const entity = await db.habits.get(habitId);
  if (entity) {
    const updatedHabit: Habit = {
      ...habitEntityToDomain(entity),
      updatedAt: ts,
      version: (entity.version ?? 0) + 1
    };
    await persistHabitInDb(updatedHabit);
  }

  const payload = nextCount === 0
    ? { habitId, date: key, updatedAt: ts, id: deletedEntity?.id }
    : {
        habitId,
        date: key,
        done: true,
        count: nextCount,
        updatedAt: ts,
        version: entity?.version ?? 1
      };
  const entry = createOutboxEntry('checkin', nextCount === 0 ? 'delete' : 'upsert', payload);
  await syncEntriesWithFallback([entry]);

  return { habitId, date: key, count: nextCount };
}

export async function addHabit(data: HabitUpsertInput) {
  const now = nowSyncISO();
  const newHabit: Habit = {
    ...data,
    id: createHabitId(data.name),
    completions: {},
    dailyTarget: Math.max(1, Math.trunc(data.dailyTarget ?? 1)),
    createdAt: now,
    updatedAt: now,
    version: 1,
    sortOrder: data.sortOrder ?? Date.now(),
    reminderTime: data.reminderTime ?? undefined,
    reminderEnabled: data.reminderEnabled ?? true,
    archived: data.archived ?? false,
    freezeDays: data.freezeDays ?? []
  };
  await persistHabitWithSyncFallback(newHabit, 'upsert');
  return newHabit.id;
}

export async function updateHabit(id: string, data: Partial<Habit>) {
  const entity = await db.habits.get(id);
  if (!entity) return;
  const existing = habitEntityToDomain(entity);
  const updatedHabit: Habit = {
    ...existing,
    ...data,
    updatedAt: nowSyncISO(),
    version: (entity.version ?? 0) + 1
  };
  await persistHabitWithSyncFallback(updatedHabit, 'upsert');
}

export async function toggleFreezeDay(id: string, date: string): Promise<boolean | undefined> {
  const entity = await db.habits.get(id);
  if (!entity) return undefined;
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

export async function deleteHabit(id: string, allHabits: Habit[]) {
  const entity = await db.habits.get(id);
  const backup = allHabits.find((h) => h.id === id);
  if (!entity) return backup;
  const version = entity.version ?? 1;
  await addTombstone('habit', id, version);
  await removeHabitFromDb(id);
  const entry = createOutboxEntry('habit', 'delete', { id, version });
  await syncEntriesWithFallback([entry]);
  return backup;
}

export async function restoreHabit(habit: Habit) {
  await persistHabitInDb(habit);
  await db.tombstones.where({ entity: 'habit', entityId: habit.id }).delete();
  const entries = [createOutboxEntry('habit', 'upsert', habit as unknown as Record<string, unknown>)];
  const completionEntries = Object.entries(habit.completions).filter(([, count]) => count > 0);
  for (const [date, count] of completionEntries) {
    const ts = await upsertCheckinInDb(habit.id, date, true, count);
    entries.push(createOutboxEntry('checkin', 'upsert', {
      habitId: habit.id,
      date,
      done: true,
      count,
      updatedAt: ts,
      version: habit.version
    }));
  }
  await syncEntriesWithFallback(entries);
}

export function toggleCompletion(habitId: string, date?: string) {
  const userId = getCurrentUserId();
  return toggleCompletionImpl(habitId, date, userId);
}

export async function setCompletionCount(
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

export async function advanceCompletionCount(
  habitId: string,
  date: string,
  allHabits: Habit[]
): Promise<AdvanceCompletionResult> {
  const userId = getCurrentUserId();
  return runSerializedCompletionMutation(habitId, userId, async () => {
    const target = await resolveHabitDailyTarget(habitId, allHabits);
    const previousCount = await getPersistedCompletionCount(habitId, date, userId);
    const nextCount = previousCount >= target ? 0 : previousCount + 1;
    const result = await applyCompletionCountChange(habitId, date, nextCount);
    return {
      ...result,
      previousCount,
      target
    };
  });
}

export function getTodayCompletionRate(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  const today = formatDate(new Date());
  const completed = habits.filter(
    (habit) => (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  ).length;
  return Math.round((completed / habits.length) * 100);
}

export function getHabitStats(habitId: string, allHabits: Habit[]): HabitStats {
  const habit = allHabits.find((item) => item.id === habitId);
  if (!habit) {
    return {
      totalDays: 0,
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      automatismScore: 0,
      weeklyData: [],
      monthlyData: []
    };
  }
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const { current, longest } = calculateScheduledStreak(habit, habit.completions, new Date());
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, new Date());
  const completedDays = countCompletedDays(habit.completions, dailyTarget);
  const totalDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 86400000)
  );
  return {
    totalDays,
    completedDays,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    automatismScore: calculateAutomatismScore(habit, habit.completions, new Date()),
    weeklyData: buildWeeklyCompletionData(habit.completions, 12, new Date(), dailyTarget),
    monthlyData: buildMonthlyCompletionRates(habit.completions, 6, new Date(), dailyTarget)
  };
}

// Reactive Svelte stores
function createHabitsStore() {
  const currentUserId = getCurrentUserId();

  const habitEntities = liveQueryStore<HabitEntity[]>(
    () => db.habits.where({ userId: currentUserId }).toArray()
  );

  const checkinEntities = liveQueryStore(
    () => db.checkins.where({ userId: currentUserId }).toArray()
  );

  const completionsByHabitId = derived(checkinEntities, ($checkins) =>
    buildCompletionsByHabitId($checkins ?? [])
  );

  const allHabits = derived(
    [habitEntities, completionsByHabitId],
    ([$entities, $completions]) => mapHabits($entities ?? [], $completions)
  );

  const habits = derived(allHabits, ($all) =>
    sortHabitsByOrder($all.filter((h) => !h.archived))
  );

  const orderedAllHabits = derived(allHabits, ($all) => sortHabitsByOrder($all));

  return {
    habits,
    allHabits: orderedAllHabits
  };
}

export const habitsStore = createHabitsStore();
export { formatDate };
