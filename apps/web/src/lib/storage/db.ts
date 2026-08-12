import type { Table } from 'dexie';
import Dexie from 'dexie';
import { normalizeToCompletionKey } from '@/lib/completionKey';
import type { HabitSchedule } from '@habbit-runner/shared';
import { DEFAULT_USER_ID } from '@/lib/core/config';
import { generateId } from '@/lib/core/id';
import { nowSyncISO } from '@habbit-runner/shared';
import { normalizeCompletions, normalizeNumberArray, normalizeStringArray } from './habitEntity';

export { habitEntityToDomain } from './habitEntity';

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

function registerVersion8Schema(database: Dexie) {
  database.version(8)
    .stores({
      habits: 'id, userId, updatedAt, version, sortOrder',
      checkins: 'id, userId, habitId, date, updatedAt, version, [userId+habitId+date]',
      tombstones: 'id, userId, entity, entityId, deletedAt',
      sync_meta: 'id, status',
      outbox: 'id, userId, entity, type, status',
      pending_reminders: 'id, userId, habitId, createdAt'
    })
    .upgrade(async (transaction) => {
      const habitsTable = transaction.table('habits') as Table<LegacyHabitRecord, string>;

      await habitsTable.toCollection().modify((record) => {
        record.tags = normalizeStringArray(record.tags);
        record.customDays = normalizeNumberArray(record.customDays);
        record.freezeDays = normalizeStringArray(record.freezeDays);
        record.completions = normalizeCompletions(record.completions);
        if (!Object.prototype.hasOwnProperty.call(record, 'archived')) {
          record.archived = false;
        }
        if (!Object.prototype.hasOwnProperty.call(record, 'reminderEnabled')) {
          record.reminderEnabled = true;
        }
        if (!Object.prototype.hasOwnProperty.call(record, 'type')) {
          record.type = 'positive';
        }
      });
    });
}

export class HabitRunnerDb extends Dexie {
  habits!: Table<HabitEntity>;
  checkins!: Table<CheckinEntity>;
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

    registerVersion8Schema(this);
  }
}

export const db = new HabitRunnerDb();

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
