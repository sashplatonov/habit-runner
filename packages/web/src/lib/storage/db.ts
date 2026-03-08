import type { Table } from 'dexie';
import Dexie from 'dexie';
import type { Habit } from '@/types/habit';
import type { PullResponseDto } from '@/types/sync';
import type { SyncEntity, SyncOpType } from '@habbit-runner/shared';
import { DEFAULT_USER_ID } from '@/lib/core/config';
import { generateId } from '@/lib/core/id';

export type OutboxStatus = 'pending' | 'inflight' | 'failed';

let currentUserId = DEFAULT_USER_ID;

export function setCurrentUserId(userId?: string | null): void {
  const normalized = userId?.trim();
  currentUserId = normalized ? normalized : DEFAULT_USER_ID;
}

export function getCurrentUserId(): string {
  return currentUserId;
}

export interface HabitEntity {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  frequency: string;
  targetStreak: number;
  tags: string[];
  customDays?: number[];
  archived: boolean;
  completions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  version: number;
  sortOrder: number;
  reminderTime?: string | null;
  reminderEnabled: boolean;
  freezeDays: string[];
}

export interface CheckinEntity {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  done: boolean;
  updatedAt: string;
  version: number;
}

export interface TombstoneEntity {
  id: string;
  userId: string;
  entity: SyncEntity;
  entityId: string;
  deletedAt: string;
  version: number;
}

export interface SyncMeta {
  id: string;
  status: 'idle' | 'syncing' | 'offline' | 'error';
  lastCursor?: string;
  lastSyncedAt?: string;
  lastError?: string;
}

export interface OutboxEntry {
  id: string;
  userId: string;
  entity: SyncEntity;
  type: SyncOpType;
  payload: Record<string, unknown>;
  clientTime: string;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt?: string | null;
  createdAt: string;
  lastError?: string;
}

export class HabbitRunnerDb extends Dexie {
  habits!: Table<HabitEntity>;
  checkins!: Table<CheckinEntity>;
  tombstones!: Table<TombstoneEntity>;
  sync_meta!: Table<SyncMeta>;
  outbox!: Table<OutboxEntry>;

  constructor() {
    super('habbitRunner');
    this.version(1).stores({
      habits: 'id, userId, updatedAt, version',
      checkins: 'id, userId, habitId, date, updatedAt, version',
      tombstones: 'id, userId, entity, entityId, deletedAt',
      sync_meta: 'id, status',
      outbox: 'id, userId, entity, type, status'
    });

    this.version(2)
      .stores({
        habits: 'id, userId, updatedAt, version, sortOrder',
        checkins: 'id, userId, habitId, date, updatedAt, version',
        tombstones: 'id, userId, entity, entityId, deletedAt',
        sync_meta: 'id, status',
        outbox: 'id, userId, entity, type, status'
      })
      .upgrade((transaction) =>
        transaction.habits.toCollection().modify((record) => {
          if (record.sortOrder === undefined || record.sortOrder === null) {
            record.sortOrder = Date.parse(record.createdAt) || Date.now();
          }
          if (!Object.prototype.hasOwnProperty.call(record, 'reminderTime')) {
            record.reminderTime = null;
          }
          if (!Object.prototype.hasOwnProperty.call(record, 'reminderEnabled')) {
            record.reminderEnabled = true;
          }
        })
      );
  }
}

export const db = new HabbitRunnerDb();

export function habitEntityToDomain(entity: HabitEntity): Habit {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? '',
      color: entity.color as Habit['color'],
      icon: entity.icon,
      frequency: entity.frequency as Habit['frequency'],
      customDays: entity.customDays,
      targetStreak: entity.targetStreak,
      tags: entity.tags,
      completions: { ...entity.completions },
      freezeDays: entity.freezeDays ?? [],
      sortOrder: entity.sortOrder ?? Date.parse(entity.createdAt),
      reminderTime: entity.reminderTime ?? undefined,
      reminderEnabled: entity.reminderEnabled ?? true,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
      archived: entity.archived
    };
}

export function domainToHabitEntity(habit: Habit): HabitEntity {
  const userId = getCurrentUserId();
  return {
    id: habit.id,
    userId,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    icon: habit.icon,
    frequency: habit.frequency,
    targetStreak: habit.targetStreak,
    tags: habit.tags,
    customDays: habit.customDays,
    archived: habit.archived,
    completions: {},
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt ?? habit.createdAt,
    version: habit.version ?? 1,
    sortOrder: habit.sortOrder ?? Date.parse(habit.createdAt),
    reminderTime: habit.reminderTime ?? null,
    reminderEnabled: habit.reminderEnabled ?? true,
    freezeDays: habit.freezeDays ?? []
  };
}

export async function persistHabitInDb(habit: Habit): Promise<void> {
  await db.habits.put(domainToHabitEntity(habit));
}

export async function removeHabitFromDb(id: string): Promise<void> {
  const userId = getCurrentUserId();
  const target = await db.habits.get(id);
  if (target?.userId === userId) {
    await db.habits.delete(id);
  }
  await db.checkins.where({ habitId: id, userId }).delete();
}

export async function addTombstone(
  entity: SyncEntity,
  entityId: string,
  version: number
): Promise<void> {
  const userId = getCurrentUserId();
  await db.tombstones.add({
    id: generateId(),
    userId,
    entity,
    entityId,
    version,
    deletedAt: new Date().toISOString()
  });
}

export async function upsertCheckinInDb(
  habitId: string,
  date: string,
  done: boolean
): Promise<void> {
  const userId = getCurrentUserId();
  const normalized = date;
  const existing = await db.checkins
    .where('habitId')
    .equals(habitId)
    .filter(
      (record) =>
        record.date === normalized && record.userId === userId
    )
    .first();

  if (existing) {
    if (!done) {
      await db.checkins.delete(existing.id);
      return;
    }
    await db.checkins.update(existing.id, {
      done,
      updatedAt: new Date().toISOString(),
      version: Math.max(existing.version, 1) + 1
    });
    return;
  }

  if (!done) {return;}
  await db.checkins.add({
    id: generateId(),
    userId,
    habitId,
    date: normalized,
    done,
    updatedAt: new Date().toISOString(),
    version: 1
  });
}

export async function deleteCheckinInDb(habitId: string, date: string): Promise<void> {
  const userId = getCurrentUserId();
  const normalized = date;
  const existing = await db.checkins
    .where('habitId')
    .equals(habitId)
    .filter(
      (record) =>
        record.date === normalized && record.userId === userId
    )
    .first();
  if (existing) {
    await db.checkins.delete(existing.id);
  }
}

export async function enqueueOutboxEntry(entry: OutboxEntry): Promise<void> {
  await db.outbox.put(entry);
}

export function createOutboxEntry(
  entity: SyncEntity,
  type: SyncOpType,
  payload: Record<string, unknown>
): OutboxEntry {
  const userId = getCurrentUserId();
  return {
    id: generateId(),
    userId,
    entity,
    type,
    payload,
    clientTime: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    nextRetryAt: null,
    createdAt: new Date().toISOString()
  };
}

function syncMetaId(userId: string): string {
  return `meta:${userId}`;
}

export async function ensureSyncMeta(): Promise<SyncMeta> {
  const userId = getCurrentUserId();
  const id = syncMetaId(userId);
  const existing = await db.sync_meta.get(id);
  if (existing) {return existing;}
  const meta: SyncMeta = {
    id,
    status: 'idle'
  };
  await db.sync_meta.put(meta);
  return meta;
}

export async function updateSyncMeta(data: Partial<SyncMeta>): Promise<void> {
  const current = await ensureSyncMeta();
  await db.sync_meta.put({ ...current, ...data });
}

export async function countPendingOutboxEntries(): Promise<number> {
  const userId = getCurrentUserId();
  return await db.outbox
    .filter((entry) => entry.userId === userId && entry.status !== 'inflight')
    .count();
}

const ISO_NOW = () => new Date().toISOString();

export async function getReadyOutboxEntries(limit = 32): Promise<OutboxEntry[]> {
  const userId = getCurrentUserId();
  const now = ISO_NOW();
  return await db.outbox
    .filter(
      (entry) =>
        entry.userId === userId &&
        entry.status !== 'inflight' &&
        (!entry.nextRetryAt || entry.nextRetryAt <= now)
    )
    .sortBy('createdAt')
    .then((entries) => entries.slice(0, limit));
}

export async function markOutboxEntriesInflight(ids: string[]): Promise<void> {
  const userId = getCurrentUserId();
  await Promise.all(
    ids.map(async (id) => {
      const entry = await db.outbox.get(id);
      if (!entry || entry.userId !== userId) {return;}
      await db.outbox.update(id, {
        status: 'inflight',
        lastError: undefined
      });
    })
  );
}

export async function deleteOutboxEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) {return;}
  await db.outbox.bulkDelete(ids);
}

export async function updateOutboxEntryFailure(
  entry: OutboxEntry,
  reason: string,
  nextRetryAt?: string
): Promise<void> {
  await db.outbox.update(entry.id, {
    status: 'failed',
    lastError: reason,
    retryCount: entry.retryCount + 1,
    nextRetryAt: nextRetryAt ?? new Date().toISOString()
  });
}

export async function applyPullResponse(
  response: PullResponseDto
): Promise<void> {
  const userId = getCurrentUserId();
  const habitPromises = response.habits.map(async (habit) => {
    await db.habits.put({
      id: habit.id,
      userId,
      name: habit.name,
      description: habit.description ?? null,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency,
      targetStreak: habit.targetStreak,
      tags: (habit.tags as string[]) ?? [],
      customDays: Array.isArray(habit.customDays) ?
      habit.customDays.filter((day): day is number => typeof day === 'number') :
      undefined,
      archived: habit.archived,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      version: habit.version,
      sortOrder:
        typeof habit.sortOrder === 'number'
          ? habit.sortOrder
          : Date.parse(habit.createdAt) || Date.now(),
      reminderTime:
        typeof habit.reminderTime === 'string' ? habit.reminderTime : null
    });
  });

  const checkinPromises = response.checkins.map(async (checkin) => {
    await db.checkins
      .where('habitId')
      .equals(checkin.habitId)
      .filter(
        (record) =>
          record.date === checkin.date &&
          record.userId === userId &&
          record.id !== checkin.id
      )
      .delete();
    await db.checkins.put({
      id: checkin.id,
      userId,
      habitId: checkin.habitId,
      date: checkin.date,
      done: checkin.done,
      updatedAt: checkin.updatedAt,
      version: checkin.version
    });
  });

  const tombstonePromises = response.tombstones.map(async (tombstone) => {
    if (tombstone.entity === 'habit') {
      await removeHabitFromDb(tombstone.entityId);
    } else if (tombstone.entity === 'checkin') {
      await db.checkins.delete(tombstone.entityId);
    }
  });

  await Promise.all([...habitPromises, ...checkinPromises, ...tombstonePromises]);
}

export function getBackoffMs(retries: number): number {
  const attempt = Math.min(retries, 6);
  return (attempt + 1) * 1000;
}
