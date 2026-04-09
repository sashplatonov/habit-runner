import type { PullResponseDto } from '@/types/sync';
import type { HabitEntity } from './db';
import {
  db,
  deleteCheckinInDb,
  getCheckinByNaturalKey,
  getCurrentUserId,
  removeHabitFromDb
} from './db';
import { normalizeToCompletionKey } from '@/lib/completionKey';

function shouldApplyRemoteRecord(
  existing: { updatedAt: string; version: number } | undefined,
  incomingUpdatedAt: string,
  incomingVersion: number
): boolean {
  if (!existing) {
    return true;
  }
  const existingTs = Date.parse(existing.updatedAt);
  const incomingTs = Date.parse(incomingUpdatedAt);
  if (!Number.isNaN(existingTs) && !Number.isNaN(incomingTs) && existingTs !== incomingTs) {
    return incomingTs > existingTs;
  }
  return incomingVersion >= existing.version;
}

function normalizeRemoteType(value?: string): HabitEntity['type'] {
  return value === 'negative' ? 'negative' : 'positive';
}

function mapRemoteHabitToEntity(habit: PullResponseDto['habits'][number], userId: string): HabitEntity {
  return {
    id: habit.id,
    userId,
    name: habit.name,
    description: habit.description ?? null,
    color: habit.color,
    icon: habit.icon,
    frequency: habit.frequency,
    targetStreak: habit.targetStreak,
    dailyTarget: Math.max(1, Math.trunc(habit.dailyTarget ?? 1)),
    tags: (habit.tags as string[]) ?? [],
    customDays: Array.isArray(habit.customDays)
      ? habit.customDays.filter((day): day is number => typeof day === 'number')
      : undefined,
    schedule: habit.schedule,
    archived: habit.archived,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
    version: habit.version,
    sortOrder:
      typeof habit.sortOrder === 'number'
        ? habit.sortOrder
        : Date.parse(habit.createdAt) || Date.now(),
    reminderTime: typeof habit.reminderTime === 'string' ? habit.reminderTime : null,
    reminderEnabled: habit.reminderEnabled ?? true,
    freezeDays: Array.isArray(habit.freezeDays) ? habit.freezeDays : [],
    completions: {},
    type: normalizeRemoteType(habit.type)
  };
}

async function applyCheckinUpsert(checkin: PullResponseDto['checkins'][number], userId: string): Promise<void> {
  const normalizedDate = normalizeToCompletionKey(checkin.date);
  const existingCheckin = await db.checkins.get(checkin.id);
  if (!shouldApplyRemoteRecord(existingCheckin, checkin.updatedAt, checkin.version)) {
    return;
  }

  await db.checkins
    .where('[userId+habitId+date]')
    .equals([userId, checkin.habitId, normalizedDate])
    .filter((record) => record.id !== checkin.id)
    .delete();

  await db.checkins.put({
    id: checkin.id,
    userId,
    habitId: checkin.habitId,
    date: normalizedDate,
    done: checkin.done,
    count: Math.max(1, Math.trunc(checkin.count ?? 1)),
    updatedAt: checkin.updatedAt,
    version: checkin.version
  });
}

async function applyHabitTombstone(tombstone: PullResponseDto['tombstones'][number]): Promise<void> {
  const existingHabit = await db.habits.get(tombstone.entityId);
  if (
    existingHabit &&
    !shouldApplyRemoteRecord(
      existingHabit,
      tombstone.deletedAt,
      Math.max(tombstone.version, existingHabit.version)
    )
  ) {
    return;
  }
  await removeHabitFromDb(tombstone.entityId);
}

async function applySimpleCheckinTombstone(tombstone: PullResponseDto['tombstones'][number]): Promise<void> {
  const existingCheckin = await db.checkins.get(tombstone.entityId);
  if (
    existingCheckin &&
    !shouldApplyRemoteRecord(
      existingCheckin,
      tombstone.deletedAt,
      Math.max(tombstone.version, existingCheckin.version)
    )
  ) {
    return;
  }
  await db.checkins.delete(tombstone.entityId);
}

async function applyDatedCheckinTombstone(
  tombstone: PullResponseDto['tombstones'][number],
  userId: string
): Promise<void> {
  const [habitId, date] = tombstone.entityId.split(':');
  if (!habitId || !date) {
    return;
  }

  const normalizedDate = normalizeToCompletionKey(date);
  const existingCheckin = await getCheckinByNaturalKey(habitId, normalizedDate, userId);

  if (
    existingCheckin &&
    !shouldApplyRemoteRecord(
      existingCheckin,
      tombstone.deletedAt,
      Math.max(tombstone.version, existingCheckin.version)
    )
  ) {
    return;
  }

  await deleteCheckinInDb(habitId, date);
}

async function applyTombstone(
  tombstone: PullResponseDto['tombstones'][number],
  userId: string
): Promise<void> {
  if (tombstone.entity === 'habit') {
    await applyHabitTombstone(tombstone);
    return;
  }
  if (tombstone.entity !== 'checkin') {
    return;
  }
  if (!tombstone.entityId.includes(':')) {
    await applySimpleCheckinTombstone(tombstone);
    return;
  }
  await applyDatedCheckinTombstone(tombstone, userId);
}

export async function applyPullResponse(response: PullResponseDto): Promise<void> {
  const userId = getCurrentUserId();
  const habitPromises = response.habits.map(async (habit) => {
    const existingHabit = await db.habits.get(habit.id);
    if (!shouldApplyRemoteRecord(existingHabit, habit.updatedAt, habit.version)) {
      return;
    }
    await db.habits.put(mapRemoteHabitToEntity(habit, userId));
  });
  const checkinPromises = response.checkins.map((checkin) => applyCheckinUpsert(checkin, userId));
  const tombstonePromises = response.tombstones.map((tombstone) => applyTombstone(tombstone, userId));
  await Promise.all([...habitPromises, ...checkinPromises, ...tombstonePromises]);
}

export function getBackoffMs(retries: number): number {
  const attempt = Math.min(retries, 6);
  return (attempt + 1) * 1000;
}
