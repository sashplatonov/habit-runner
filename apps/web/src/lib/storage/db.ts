import type { Table } from 'dexie';
import Dexie from 'dexie';
import type { Habit } from '@/types/habit';
import type { HabitSchedule, SyncEntity, SyncOpType } from '@habbit-runner/shared';
import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';
import { normalizeToCompletionKey } from '@/lib/completionKey';
import { DEFAULT_USER_ID } from '@/lib/core/config';
import { generateId } from '@/lib/core/id';
import { nowSyncISO } from '@habbit-runner/shared';

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
  dailyTarget: number;
  tags: string[];
  customDays?: number[];
  schedule?: HabitSchedule;
  archived: boolean;
  completions: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  version: number;
  sortOrder: number;
  reminderTime?: string | null;
  reminderEnabled: boolean;
  freezeDays: string[];
  type: 'positive' | 'negative';
}

export interface CheckinEntity {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  done: boolean;
  count?: number;
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

export interface PendingReminder {
  id: string;
  userId: string;
  habitId: string;
  habitName: string;
  reminderTime: string;
  createdAt: string;
}

type LegacyCheckinRecord = Partial<CheckinEntity> & { date?: string };
type LegacyHabitRecord = Partial<HabitEntity>;

const normalizeCheckinDateKey = normalizeToCompletionKey;

export class HabbitRunnerDb extends Dexie {
  habits!: Table<HabitEntity>;
  checkins!: Table<CheckinEntity>;
  tombstones!: Table<TombstoneEntity>;
  sync_meta!: Table<SyncMeta>;
  outbox!: Table<OutboxEntry>;
  pending_reminders!: Table<PendingReminder>;

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
      .upgrade((transaction) => {
        const habitsTable = transaction.table('habits') as Table<LegacyHabitRecord, string>;

        return habitsTable.toCollection().modify((record) => {
          if (record.sortOrder === undefined || record.sortOrder === null) {
            record.sortOrder = Date.parse(record.createdAt ?? new Date().toISOString()) || Date.now();
          }
          if (!Object.prototype.hasOwnProperty.call(record, 'reminderTime')) {
            record.reminderTime = null;
          }
          if (!Object.prototype.hasOwnProperty.call(record, 'reminderEnabled')) {
            record.reminderEnabled = true;
          }
          if (!Object.prototype.hasOwnProperty.call(record, 'dailyTarget')) {
            record.dailyTarget = 1;
          }
        });
      });

    this.version(3)
      .stores({
        habits: 'id, userId, updatedAt, version, sortOrder',
        checkins: 'id, userId, habitId, date, updatedAt, version',
        tombstones: 'id, userId, entity, entityId, deletedAt',
        sync_meta: 'id, status',
        outbox: 'id, userId, entity, type, status'
      })
      .upgrade((transaction) => {
        const checkinsTable = transaction.table('checkins') as Table<LegacyCheckinRecord, string>;

        return checkinsTable.toCollection().modify((record) => {
          if (!Object.prototype.hasOwnProperty.call(record, 'count')) {
            record.count = 1;
          }
        });
      });

    this.version(4)
      .stores({
        habits: 'id, userId, updatedAt, version, sortOrder',
        checkins: 'id, userId, habitId, date, updatedAt, version',
        tombstones: 'id, userId, entity, entityId, deletedAt',
        sync_meta: 'id, status',
        outbox: 'id, userId, entity, type, status'
      })
      .upgrade((transaction) => {
        const habitsTable = transaction.table('habits') as Table<LegacyHabitRecord, string>;

        return habitsTable.toCollection().modify((record) => {
          if (!Object.prototype.hasOwnProperty.call(record, 'dailyTarget')) {
            record.dailyTarget = 1;
          }
        });
      });

    this.version(5)
      .stores({
        habits: 'id, userId, updatedAt, version, sortOrder',
        checkins: 'id, userId, habitId, date, updatedAt, version',
        tombstones: 'id, userId, entity, entityId, deletedAt',
        sync_meta: 'id, status',
        outbox: 'id, userId, entity, type, status',
        pending_reminders: 'id, userId, habitId, createdAt'
      })
      .upgrade(async (transaction) => {
        const checkinsTable = transaction.table('checkins') as Table<LegacyCheckinRecord, string>;
        const habitsTable = transaction.table('habits') as Table<LegacyHabitRecord, string>;

        await checkinsTable.toCollection().modify((record) => {
          if (record.date && record.date.length === 10) {
            record.date = `${record.date}T00:00:00Z`;
          }
        });

        await habitsTable.toCollection().modify((record) => {
          if (record.type === undefined) {record.type = 'positive';}
        });
      });

    this.version(6)
      .stores({
        habits: 'id, userId, updatedAt, version, sortOrder',
        checkins: 'id, userId, habitId, date, updatedAt, version',
        tombstones: 'id, userId, entity, entityId, deletedAt',
        sync_meta: 'id, status',
        outbox: 'id, userId, entity, type, status',
        pending_reminders: 'id, userId, habitId, createdAt'
      })
      .upgrade(async (transaction) => {
        const checkinsTable = transaction.table('checkins') as Table<LegacyCheckinRecord, string>;

        await checkinsTable.toCollection().modify((record) => {
          if (record.date) {
            record.date = normalizeCheckinDateKey(record.date);
          }
        });
      });

    this.version(7).stores({
      habits: 'id, userId, updatedAt, version, sortOrder',
      checkins: 'id, userId, habitId, date, updatedAt, version, [userId+habitId+date]',
      tombstones: 'id, userId, entity, entityId, deletedAt',
      sync_meta: 'id, status',
      outbox: 'id, userId, entity, type, status',
      pending_reminders: 'id, userId, habitId, createdAt'
    });
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
      dailyTarget: Math.max(1, Math.trunc(entity.dailyTarget ?? 1)),
      tags: entity.tags,
      completions: { ...entity.completions },
      freezeDays: entity.freezeDays ?? [],
      sortOrder: entity.sortOrder ?? Date.parse(entity.createdAt),
      reminderTime: entity.reminderTime ?? undefined,
      reminderEnabled: entity.reminderEnabled ?? true,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
      archived: entity.archived,
      type: entity.type ?? 'positive',
      schedule:
        normalizeSchedule(entity.schedule) ??
        scheduleFromLegacy(entity.frequency as Habit['frequency'], entity.customDays)
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
    dailyTarget: Math.max(1, Math.trunc(habit.dailyTarget ?? 1)),
    tags: habit.tags,
    customDays: habit.customDays,
    schedule: habit.schedule,
    archived: habit.archived,
    completions: {},
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt ?? habit.createdAt,
    version: habit.version ?? 1,
    sortOrder: habit.sortOrder ?? Date.parse(habit.createdAt),
    reminderTime: habit.reminderTime ?? null,
    reminderEnabled: habit.reminderEnabled ?? true,
    freezeDays: habit.freezeDays ?? [],
    type: habit.type ?? 'positive'
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
    deletedAt: nowSyncISO()
  });
}

export async function upsertCheckinInDb(
  habitId: string,
  date: string,
  done: boolean,
  count = 1,
  updatedAt?: string
): Promise<string> {
  const userId = getCurrentUserId();
  const normalized = normalizeCheckinDateKey(date);
  const ts = updatedAt ?? nowSyncISO();
  const existing = await getCheckinByNaturalKey(habitId, normalized, userId);

  if (existing) {
    if (!done) {
      await db.checkins.delete(existing.id);
      return ts;
    }
    const normalizedCount = Math.max(1, Math.trunc(count));
    await db.checkins.update(existing.id, {
      done,
      count: normalizedCount,
      updatedAt: ts,
      version: Math.max(existing.version, 1) + 1
    });
    return ts;
  }

  if (!done) {return ts;}
  const normalizedCount = Math.max(1, Math.trunc(count));
  await db.checkins.add({
    id: generateId(),
    userId,
    habitId,
    date: normalized,
    done,
    count: normalizedCount,
    updatedAt: ts,
    version: 1
  });
  return ts;
}

export async function deleteCheckinInDb(habitId: string, date: string): Promise<CheckinEntity | undefined> {
  const userId = getCurrentUserId();
  const normalized = normalizeCheckinDateKey(date);
  const existing = await getCheckinByNaturalKey(habitId, normalized, userId);
  if (existing) {
    await db.checkins.delete(existing.id);
    return existing;
  }
  return undefined;
}

export async function getCheckinByNaturalKey(
  habitId: string,
  date: string,
  userId = getCurrentUserId()
): Promise<CheckinEntity | undefined> {
  const normalized = normalizeCheckinDateKey(date);
  return await db.checkins
    .where('[userId+habitId+date]')
    .equals([userId, habitId, normalized])
    .first();
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
    clientTime: nowSyncISO(),
    status: 'pending',
    retryCount: 0,
    nextRetryAt: null,
    createdAt: nowSyncISO()
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

export async function addPendingReminder(
  habitId: string,
  habitName: string,
  reminderTime: string
): Promise<string> {
  const userId = getCurrentUserId();
  const id = generateId();
  await db.pending_reminders.add({
    id,
    userId,
    habitId,
    habitName,
    reminderTime,
    createdAt: nowSyncISO()
  });
  return id;
}

export async function removePendingReminder(id: string): Promise<void> {
  const userId = getCurrentUserId();
  const reminder = await db.pending_reminders.get(id);
  if (reminder?.userId === userId) {
    await db.pending_reminders.delete(id);
  }
}

export async function getPendingReminders(): Promise<PendingReminder[]> {
  const userId = getCurrentUserId();
  return await db.pending_reminders
    .where('userId')
    .equals(userId)
    .toArray();
}

export { applyAcknowledgedPushResponse, applyPullResponse, getBackoffMs } from './dbSync';
