import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PullResponseDto,
  HabitDto,
  CheckinDto,
  TombstoneDto
} from './dto/pull-response.dto';
import {
  PushConflict,
  PushResponseDto,
  SyncOpDto
} from './dto/push-request.dto';
import { MetricsService } from '../metrics/metrics.service';

interface Cursor {
  updatedAt: Date;
  id: string;
}

interface HabitPayload {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  frequency: string;
  targetStreak: number;
  tags?: unknown;
  archived?: boolean;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
}

interface CheckinPayload {
  id?: string;
  habitId: string;
  date: string;
  done: boolean;
  version?: number;
  updatedAt?: string;
}

type TxClient = Omit<
  PrismaClient,
  '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
>;

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
      const cursor = this.parseCursor(since);
      const updatedFilter = cursor
        ? { AND: [this.buildCursorClause(cursor, 'updatedAt')] }
        : undefined;
      const deletedFilter = cursor
        ? { AND: [this.buildCursorClause(cursor, 'deletedAt')] }
        : undefined;

      const habits = await this.prisma.habit.findMany({
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

      const checkins = await this.prisma.checkin.findMany({
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

      const tombstones = await this.prisma.tombstone.findMany({
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

      const nextCursor = this.calculateNextCursor(cursorCandidates);
      const serverTime = new Date().toISOString();

      this.metrics.recordPull(
        Date.now() - pullStart,
        habits.length + checkins.length + tombstones.length
      );

      return {
        habits: habits.map(this.serializeHabit),
        checkins: checkins.map(this.serializeCheckin),
        tombstones: tombstones.map(this.serializeTombstone),
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
      await this.prisma.$transaction(async (tx: TxClient) => {
        for (const op of ops) {
          if (!op.id) continue;

          const deduplicated = await this.tryCreateLog(tx, op.id);
          if (!deduplicated) continue;

          if (op.entity === 'habit') {
            await this.applyHabitOp(tx, userId, op, applied, conflicts);
          } else if (op.entity === 'checkin') {
            await this.applyCheckinOp(tx, userId, op, applied, conflicts);
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
    if (!payload?.id) return;
    const timestamp = this.normalizeDate(payload.updatedAt);

    if (op.type === 'delete') {
      await tx.tombstone.create({
        data: {
          userId,
          entity: 'habit',
          entityId: payload.id,
          version: payload.version ?? 1
        }
      });
      await tx.habit.deleteMany({ where: { id: payload.id, userId } });
      applied.push(op.id);
      return;
    }

    const existing = await tx.habit.findUnique({ where: { id: payload.id } });
    if (existing && existing.userId !== userId) {
      conflicts.push({
        opId: op.id,
        reason: 'habit belongs to another user'
      });
      return;
    }
    if (
      existing &&
      new Date(existing.updatedAt).getTime() > timestamp.getTime()
    ) {
      conflicts.push({
        opId: op.id,
        reason: 'server already has newer habit',
        serverValue: {
          version: existing.version,
          updatedAt: existing.updatedAt
        }
      });
      return;
    }

    const nextVersion = Math.max(existing?.version ?? 0, payload.version ?? 0) + 1;

    const tags = this.normalizeTags(payload.tags);

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
        targetStreak: payload.targetStreak,
        tags: tags as never,
        archived: payload.archived ?? false,
        createdAt: this.normalizeDate(payload.createdAt),
        updatedAt: timestamp,
        version: nextVersion
      },
      update: {
        name: payload.name,
        description: payload.description ?? null,
        color: payload.color,
        icon: payload.icon,
        frequency: payload.frequency,
        targetStreak: payload.targetStreak,
        tags: tags as never,
        archived: payload.archived ?? false,
        updatedAt: timestamp,
        version: nextVersion
      }
    });

    applied.push(op.id);
  }

  private async applyCheckinOp(
    tx: TxClient,
    userId: string,
    op: SyncOpDto,
    applied: string[],
    conflicts: PushConflict[]
  ) {
    const payload = op.payload as unknown as CheckinPayload;
    if (!payload?.habitId || !payload.date) return;
    const timestamp = this.normalizeDate(payload.updatedAt);
    const date = new Date(payload.date);
    const parentHabit = await tx.habit.findUnique({
      where: { id: payload.habitId },
      select: { userId: true }
    });
    if (!parentHabit || parentHabit.userId !== userId) {
      conflicts.push({
        opId: op.id,
        reason: 'checkin habit belongs to another user'
      });
      return;
    }

    if (op.type === 'delete') {
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
      applied.push(op.id);
      return;
    }

    const existing = await tx.checkin.findFirst({
      where: { habitId: payload.habitId, date, userId }
    });
    if (
      existing &&
      new Date(existing.updatedAt).getTime() > timestamp.getTime()
    ) {
      conflicts.push({
        opId: op.id,
        reason: 'server already has newer checkin',
        serverValue: {
          version: existing.version,
          updatedAt: existing.updatedAt
        }
      });
      return;
    }

    const nextVersion =
      Math.max(existing?.version ?? 0, payload.version ?? 0) + 1;

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
        updatedAt: timestamp,
        version: nextVersion
      },
      update: {
        done: payload.done,
        updatedAt: timestamp,
        version: nextVersion
      }
    });

    applied.push(op.id);
  }

  private async tryCreateLog(
    tx: TxClient,
    opId: string
  ): Promise<boolean> {
    try {
      await tx.syncOpLog.create({ data: { opId } });
      return true;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return false;
      }
      throw error;
    }
  }

  private parseCursor(cursor?: string): Cursor | undefined {
    if (!cursor) return undefined;
    const parts = cursor.split('|');
    if (parts.length < 2) return undefined;
    const date = new Date(parts[0]);
    const id = parts[1];
    if (Number.isNaN(date.getTime())) return undefined;
    return { updatedAt: date, id };
  }

  private buildCursorClause(
    cursor: Cursor,
    field: 'updatedAt' | 'deletedAt'
  ) {
    return {
      OR: [
        { [field]: { gt: cursor.updatedAt } },
        {
          [field]: { equals: cursor.updatedAt },
          id: { gt: cursor.id }
        }
      ]
    };
  }

  private calculateNextCursor(
    records: { updatedAt: Date; id: string }[]
  ): string | undefined {
    if (records.length === 0) return undefined;
    const sorted = records.sort((a, b) => {
      const diff = a.updatedAt.getTime() - b.updatedAt.getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
    const last = sorted[sorted.length - 1];
    return `${last.updatedAt.toISOString()}|${last.id}`;
  }

  private serializeHabit(habit: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
    frequency: string;
    targetStreak: number;
    tags: unknown;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): HabitDto {
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency,
      targetStreak: habit.targetStreak,
      tags: habit.tags ?? undefined,
      archived: habit.archived,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
      version: habit.version
    };
  }

  private serializeCheckin(checkin: {
    id: string;
    habitId: string;
    date: Date;
    done: boolean;
    updatedAt: Date;
    version: number;
  }): CheckinDto {
    return {
      id: checkin.id,
      habitId: checkin.habitId,
      date: checkin.date.toISOString(),
      done: checkin.done,
      updatedAt: checkin.updatedAt.toISOString(),
      version: checkin.version
    };
  }

  private serializeTombstone(tombstone: {
    id: string;
    entity: string;
    entityId: string;
    deletedAt: Date;
    version: number;
  }): TombstoneDto {
    return {
      id: tombstone.id,
      entity: tombstone.entity,
      entityId: tombstone.entityId,
      deletedAt: tombstone.deletedAt.toISOString(),
      version: tombstone.version
    };
  }

  private normalizeDate(value?: string): Date {
    if (!value) return new Date();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date();
    return parsed;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    if (!('code' in error)) return false;
    return (error as { code?: string }).code === 'P2002';
  }

  private normalizeTags(value: unknown): unknown {
    if (value === undefined) return undefined;
    if (value === null) return undefined;
    return value;
  }
}
