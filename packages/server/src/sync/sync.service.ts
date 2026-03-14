import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  PullResponseDto
} from './dto/pull-response.dto';
import type {
  PushConflict,
  PushResponseDto,
  SyncOpDto
} from './dto/push-request.dto';
import { MetricsService } from '../metrics/metrics.service';
import type {
  CheckinPayload,
  ExistingCheckinRecord,
  ExistingHabitRecord,
  HabitPayload,
  ParentHabitRecord,
  TxClient
} from './sync.types';
import {
  buildCursorClause,
  calculateNextCursor,
  normalizeCustomDays,
  normalizeDate,
  normalizeReminderEnabled,
  normalizeReminderTime,
  normalizeSortOrder,
  normalizeTags,
  parseCursor,
  serializeCheckin,
  serializeHabit,
  serializeTombstone
} from './sync.utils';
import { HABIT_FREQUENCIES, HabitFrequency, HabitSchedule, normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService
  ) {}

  async pull(userId: string, since?: string, traceId?: string): Promise<PullResponseDto> {
    const pullStart = Date.now();
    try {
      const cursor = parseCursor(since);
      const updatedFilter = cursor
        ? { AND: [buildCursorClause(cursor, 'updatedAt')] }
        : undefined;
      const deletedFilter = cursor
        ? { AND: [buildCursorClause(cursor, 'deletedAt')] }
        : undefined;

      const client = await this.prisma.getClient();
      const habits = await client.habit.findMany({
        where: {
          userId,
          ...updatedFilter
        },
        orderBy: [
          { updatedAt: 'asc' },
          { id: 'asc' }
        ],
        take: 200
      });

      const checkins = await client.checkin.findMany({
        where: {
          userId,
          ...updatedFilter
        },
        orderBy: [
          { updatedAt: 'asc' },
          { id: 'asc' }
        ],
        take: 200
      });

      const tombstones = await client.tombstone.findMany({
        where: {
          userId,
          ...deletedFilter
        },
        orderBy: [
          { deletedAt: 'asc' },
          { id: 'asc' }
        ],
        take: 200
      });

      const cursorCandidates = [
        ...habits.map((h: { updatedAt: Date; id: string }) => ({ updatedAt: h.updatedAt, id: h.id })),
        ...checkins.map((c: { updatedAt: Date; id: string }) => ({ updatedAt: c.updatedAt, id: c.id })),
        ...tombstones.map((t: { deletedAt: Date; id: string }) => ({ updatedAt: t.deletedAt, id: t.id }))
      ];

      const nextCursor = calculateNextCursor(cursorCandidates);
      const serverTime = new Date().toISOString();

      this.metrics.recordPull(
        Date.now() - pullStart,
        habits.length + checkins.length + tombstones.length
      );

      return {
        habits: habits.map(serializeHabit),
        checkins: checkins.map(serializeCheckin),
        tombstones: tombstones.map(serializeTombstone),
        nextCursor,
        serverTime
      };
    } catch (error) {
      this.metrics.recordError();
      this.logger.error(
        `sync pull failed userId=${userId} traceId=${traceId ?? 'n/a'}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  async push(userId: string, ops: SyncOpDto[], traceId?: string): Promise<PushResponseDto> {
    const pushStart = Date.now();
    const applied: string[] = [];
    const conflicts: PushConflict[] = [];
    const serverTime = new Date().toISOString();

    try {
      const client = await this.prisma.getClient();
      await client.$transaction(async (tx) => {
        const txClient = tx as unknown as TxClient;
        for (const op of ops) {
          if (!op.id) {continue;}

          const deduplicated = await this.tryCreateLog(txClient, op.id);
          if (!deduplicated) {continue;}

          if (op.entity === 'habit') {
            await this.applyHabitOp(txClient, userId, op, applied, conflicts);
          } else if (op.entity === 'checkin') {
            await this.applyCheckinOp(txClient, userId, op, applied, conflicts);
          }
        }
      });
    } catch (error) {
      this.metrics.recordError();
      this.logger.error(
        `sync push failed userId=${userId} traceId=${traceId ?? 'n/a'}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }

    this.metrics.recordPush(Date.now() - pushStart, conflicts.length, ops.length);
    return { applied, conflicts, serverTime };
  }

  private async applyHabitOp(
    tx: TxClient,
    userId: string,
    op: SyncOpDto,
    applied: string[],
    conflicts: PushConflict[]
  ) {
    const payload = op.payload as unknown as HabitPayload;
    if (!payload?.id) {return;}
    const timestamp = normalizeDate(payload.updatedAt);

    if (op.type === 'delete') {
      await this.deleteHabit(tx, userId, payload);
      applied.push(op.id);
      return;
    }

    const existing = await tx.habit.findUnique({ where: { id: payload.id } }) as ExistingHabitRecord | null;
    if (this.hasHabitOwnershipConflict(existing, userId)) {
      conflicts.push({
        opId: op.id,
        reason: 'habit belongs to another user'
      });
      return;
    }
    if (this.hasNewerHabitConflict(existing, timestamp, op.id, conflicts)) {return;}

    await this.upsertHabit(tx, userId, payload, existing, timestamp);

    applied.push(op.id);
  }

  private async deleteHabit(tx: TxClient, userId: string, payload: HabitPayload): Promise<void> {
    await tx.tombstone.create({
      data: {
        userId,
        entity: 'habit',
        entityId: payload.id,
        version: payload.version ?? 1
      }
    });
    await tx.checkin.deleteMany({ where: { habitId: payload.id, userId } });
    await tx.habit.deleteMany({ where: { id: payload.id, userId } });
  }

  private hasHabitOwnershipConflict(existing: ExistingHabitRecord | null, userId: string): boolean {
    return Boolean(existing && existing.userId !== userId);
  }

  private hasNewerHabitConflict(
    existing: ExistingHabitRecord | null,
    timestamp: Date,
    opId: string,
    conflicts: PushConflict[]
  ): boolean {
    if (!existing || new Date(existing.updatedAt).getTime() <= timestamp.getTime()) {
      return false;
    }

    conflicts.push({
      opId,
      reason: 'server already has newer habit',
      serverValue: {
        version: existing.version,
        updatedAt: existing.updatedAt
      }
    });
    return true;
  }

  private async upsertHabit(
    tx: TxClient,
    userId: string,
    payload: HabitPayload,
    existing: ExistingHabitRecord | null,
    timestamp: Date
  ): Promise<void> {
    const writeValues = this.buildHabitWriteValues(payload, existing);
    await tx.habit.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        userId,
        name: payload.name,
        description: payload.description ?? null,
        color: payload.color,
        icon: payload.icon,
        frequency: payload.frequency,
        customDays: writeValues.customDays as never,
        schedule: writeValues.schedule as never,
        targetStreak: payload.targetStreak,
        dailyTarget: writeValues.dailyTarget,
        tags: writeValues.tags as never,
        archived: payload.archived ?? false,
        createdAt: normalizeDate(payload.createdAt),
        sortOrder: writeValues.sortOrder,
        reminderTime: writeValues.reminderTime,
        reminderEnabled: writeValues.reminderEnabled,
        difficulty: writeValues.difficulty,
        type: writeValues.type,
        updatedAt: timestamp,
        version: writeValues.nextVersion
      },
      update: {
        name: payload.name,
        description: payload.description ?? null,
        color: payload.color,
        icon: payload.icon,
        frequency: payload.frequency,
        customDays: writeValues.customDays as never,
        schedule: writeValues.schedule as never,
        targetStreak: payload.targetStreak,
        dailyTarget: writeValues.dailyTarget,
        tags: writeValues.tags as never,
        archived: payload.archived ?? false,
        sortOrder: writeValues.sortOrder,
        reminderTime: writeValues.reminderTime,
        reminderEnabled: writeValues.reminderEnabled,
        difficulty: writeValues.difficulty,
        type: writeValues.type,
        updatedAt: timestamp,
        version: writeValues.nextVersion
      }
    });
  }

  private buildHabitWriteValues(
    payload: HabitPayload,
    existing: ExistingHabitRecord | null
  ): {
    nextVersion: number;
    sortOrder: bigint;
    dailyTarget: number;
    reminderTime: string | null;
    reminderEnabled: boolean;
    tags: unknown;
    customDays: number[] | undefined;
    schedule: HabitSchedule;
    difficulty: number;
    type: string;
  } {
    return {
      nextVersion: this.resolveHabitVersion(existing, payload.version),
      sortOrder: this.resolveHabitSortOrder(existing, payload.sortOrder),
      dailyTarget: this.resolveHabitDailyTarget(existing, payload.dailyTarget),
      reminderTime: this.resolveHabitReminderTime(existing, payload.reminderTime),
      reminderEnabled: this.resolveHabitReminderEnabled(existing, payload.reminderEnabled),
      tags: normalizeTags(payload.tags),
      customDays: normalizeCustomDays(payload.customDays),
      schedule: this.resolveHabitSchedule(existing, payload),
      difficulty: this.resolveHabitDifficulty(existing, payload.difficulty),
      type: this.resolveHabitType(existing, payload.type)
    };
  }

  private resolveHabitVersion(existing: ExistingHabitRecord | null, payloadVersion?: number): number {
    return Math.max(existing?.version ?? 0, payloadVersion ?? 0) + 1;
  }

  private resolveHabitSortOrder(existing: ExistingHabitRecord | null, payloadSortOrder?: number): bigint {
    const normalizedSortOrder = normalizeSortOrder(payloadSortOrder);
    if (typeof normalizedSortOrder === 'number') {
      return BigInt(normalizedSortOrder);
    }

    const existingSortOrder = existing?.sortOrder;
    if (typeof existingSortOrder === 'bigint') {
      return existingSortOrder;
    }
    if (typeof existingSortOrder === 'number') {
      return BigInt(Math.trunc(existingSortOrder));
    }

    return 0n;
  }

  private resolveHabitDailyTarget(existing: ExistingHabitRecord | null, payloadDailyTarget?: number): number {
    if (typeof payloadDailyTarget === 'number' && Number.isFinite(payloadDailyTarget)) {
      return Math.max(1, Math.trunc(payloadDailyTarget));
    }
    return Math.max(1, existing?.dailyTarget ?? 1);
  }

  private resolveHabitReminderTime(
    existing: ExistingHabitRecord | null,
    payloadReminderTime?: string | null
  ): string | null {
    return normalizeReminderTime(payloadReminderTime ?? existing?.reminderTime);
  }

  private resolveHabitReminderEnabled(
    existing: ExistingHabitRecord | null,
    payloadReminderEnabled?: boolean
  ): boolean {
    return normalizeReminderEnabled(payloadReminderEnabled, existing?.reminderEnabled ?? true);
  }

  private resolveHabitSchedule(
    existing: ExistingHabitRecord | null,
    payload: HabitPayload
  ): HabitSchedule {
    const normalized = normalizeSchedule(payload.schedule);
    if (normalized) {
      return normalized;
    }
    if (existing?.schedule) {
      const inherited = normalizeSchedule(existing.schedule);
      if (inherited) {
        return inherited;
      }
    }
    const frequency = this.normalizeHabitFrequency(payload.frequency);
    return scheduleFromLegacy(frequency, normalizeCustomDays(payload.customDays));
  }

  private normalizeHabitFrequency(value: unknown): HabitFrequency {
    if (typeof value !== 'string') {
      return 'daily';
    }
    if ((HABIT_FREQUENCIES as readonly string[]).includes(value)) {
      return value as HabitFrequency;
    }
    return 'daily';
  }

  private async applyCheckinOp(
    tx: TxClient,
    userId: string,
    op: SyncOpDto,
    applied: string[],
    conflicts: PushConflict[]
  ) {
    const payload = op.payload as unknown as CheckinPayload;
    if (!payload?.habitId || !payload.date) {
      return;
    }
    const timestamp = normalizeDate(payload.updatedAt);
    const date = new Date(payload.date);
    const parentHabit = await this.findParentHabit(tx, payload.habitId);
    if (!this.canApplyCheckinForUser(parentHabit, userId, op.id, conflicts)) {
      return;
    }

    if (op.type === 'delete') {
      await this.deleteCheckin(tx, userId, payload, date);
      applied.push(op.id);
      return;
    }

    const existing = await tx.checkin.findFirst({
      where: { habitId: payload.habitId, date, userId }
    }) as ExistingCheckinRecord | null;
    if (this.hasNewerCheckinConflict(existing, timestamp, op.id, conflicts)) {
      return;
    }

    const nextVersion =
      Math.max(existing?.version ?? 0, payload.version ?? 0) + 1;
    const normalizedCount = Math.max(1, Math.trunc(payload.count ?? 1));

    await tx.checkin.upsert({
      where: {
        habit_date_unique: {
          habitId: payload.habitId,
          date
        }
      },
      create: {
        habitId: payload.habitId,
        userId,
        date,
        done: payload.done,
        count: normalizedCount,
        updatedAt: timestamp,
        version: nextVersion
      },
      update: {
        done: payload.done,
        count: normalizedCount,
        updatedAt: timestamp,
        version: nextVersion
      }
    });

    applied.push(op.id);
  }

  private async findParentHabit(tx: TxClient, habitId: string): Promise<ParentHabitRecord | null> {
    return tx.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    }) as Promise<ParentHabitRecord | null>;
  }

  private canApplyCheckinForUser(
    parentHabit: ParentHabitRecord | null,
    userId: string,
    opId: string,
    conflicts: PushConflict[]
  ): boolean {
    if (parentHabit && parentHabit.userId === userId) {
      return true;
    }

    conflicts.push({
      opId,
      reason: 'checkin habit belongs to another user'
    });
    return false;
  }

  private async deleteCheckin(
    tx: TxClient,
    userId: string,
    payload: CheckinPayload,
    date: Date
  ): Promise<void> {
    await tx.tombstone.create({
      data: {
        userId,
        entity: 'checkin',
        entityId: payload.id ?? `${payload.habitId}:${payload.date}`,
        version: payload.version ?? 1
      }
    });
    await tx.checkin.deleteMany({
      where: { habitId: payload.habitId, date, userId }
    });
  }

  private hasNewerCheckinConflict(
    existing: ExistingCheckinRecord | null,
    timestamp: Date,
    opId: string,
    conflicts: PushConflict[]
  ): boolean {
    if (!existing || new Date(existing.updatedAt).getTime() <= timestamp.getTime()) {
      return false;
    }

    conflicts.push({
      opId,
      reason: 'server already has newer checkin',
      serverValue: {
        version: existing.version,
        updatedAt: existing.updatedAt
      }
    });
    return true;
  }

  private resolveHabitDifficulty(existing: ExistingHabitRecord | null, payloadValue?: number): number {
    if (typeof payloadValue === 'number') {
      return Math.max(1, Math.min(5, Math.trunc(payloadValue)));
    }
    return existing?.difficulty ?? 1;
  }

  private resolveHabitType(existing: ExistingHabitRecord | null, payloadValue?: string): string {
    if (typeof payloadValue === 'string') {
      return payloadValue === 'negative' ? 'negative' : 'positive';
    }
    return existing?.type ?? 'positive';
  }

  private async tryCreateLog(
    tx: TxClient,
    opId: string
  ): Promise<boolean> {
    const result = await tx.syncOpLog.createMany({
      data: [{ opId }],
      skipDuplicates: true
    });
    return result.count > 0;
  }
}
