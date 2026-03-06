import { test, after, before, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthController } from '../../src/auth/auth.controller';
import type { RequestWithUser } from '../../src/auth/auth.guard';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AuthService } from '../../src/auth/auth.service';
import { MetricsService } from '../../src/metrics/metrics.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SyncController } from '../../src/sync/sync.controller';
import { SyncService } from '../../src/sync/sync.service';

type UserRecord = {
  id: string;
  email: string;
};

type RefreshTokenRecord = {
  token: string;
  userId: string;
  revoked: boolean;
  expiresAt: Date;
};

type HabitRecord = {
  id: string;
  userId: string;
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
};

type CheckinRecord = {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  done: boolean;
  updatedAt: Date;
  version: number;
};

type TombstoneRecord = {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  version: number;
  deletedAt: Date;
};

class InMemoryPrismaMock {
  private users: UserRecord[] = [];
  private refreshTokens: RefreshTokenRecord[] = [];
  private habits: HabitRecord[] = [];
  private checkins: CheckinRecord[] = [];
  private tombstones: TombstoneRecord[] = [];
  private syncOpIds = new Set<string>();

  reset() {
    this.users = [{ id: 'user-1', email: 'alice@example.com' }];
    this.refreshTokens = [];
    this.habits = [
      {
        id: 'habit-1',
        userId: 'user-1',
        name: 'Read 20 pages',
        description: null,
        color: '#22c55e',
        icon: 'book-open',
        frequency: 'daily',
        targetStreak: 7,
        tags: ['mindset'],
        archived: false,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        version: 1
      }
    ];
    this.checkins = [];
    this.tombstones = [];
    this.syncOpIds = new Set<string>();
  }

  user = {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const { id, email } = args.where;
      const found = this.users.find(
        (user) =>
          (typeof id === 'string' && user.id === id) ||
          (typeof email === 'string' && user.email === email)
      );
      return found ?? null;
    },
    create: async (args: { data: { email: string }; select: { id: true; email: true } }) => {
      const created = { id: `user-${this.users.length + 1}`, email: args.data.email };
      this.users.push(created);
      return created;
    }
  };

  refreshToken = {
    create: async (args: { data: { token: string; userId: string; expiresAt: Date } }) => {
      const record: RefreshTokenRecord = {
        token: args.data.token,
        userId: args.data.userId,
        expiresAt: args.data.expiresAt,
        revoked: false
      };
      this.refreshTokens.push(record);
      return record;
    },
    findUnique: async (args: { where: { token: string } }) => {
      return this.refreshTokens.find((token) => token.token === args.where.token) ?? null;
    },
    updateMany: async (args: { where: { token: string }; data: { revoked: boolean } }) => {
      let count = 0;
      this.refreshTokens = this.refreshTokens.map((token) => {
        if (token.token !== args.where.token) {return token;}
        count += 1;
        return { ...token, revoked: args.data.revoked };
      });
      return { count };
    }
  };

  habit = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.habits
        .filter((habit) => this.matchesWhere(habit, args.where, 'updatedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.updatedAt, b.updatedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    findUnique: async (args: { where: { id: string }; select?: { userId: true } }) => {
      const found = this.habits.find((habit) => habit.id === args.where.id);
      if (!found) {return null;}
      if (args.select?.userId) {
        return { userId: found.userId };
      }
      return found;
    },
    upsert: async (args: {
      where: { id: string };
      create: HabitRecord;
      update: Omit<HabitRecord, 'id' | 'userId' | 'createdAt'>;
    }) => {
      const index = this.habits.findIndex((habit) => habit.id === args.where.id);
      if (index === -1) {
        this.habits.push(args.create);
        return args.create;
      }
      const updated: HabitRecord = {
        ...this.habits[index],
        ...args.update
      };
      this.habits[index] = updated;
      return updated;
    },
    deleteMany: async (args: { where: { id?: string; userId: string } }) => {
      const before = this.habits.length;
      this.habits = this.habits.filter((habit) => {
        if (habit.userId !== args.where.userId) {return true;}
        if (args.where.id && habit.id !== args.where.id) {return true;}
        return false;
      });
      return { count: before - this.habits.length };
    }
  };

  checkin = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.checkins
        .filter((checkin) => this.matchesWhere(checkin, args.where, 'updatedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.updatedAt, b.updatedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    findFirst: async (args: { where: { habitId: string; date: Date; userId: string } }) => {
      return (
        this.checkins.find(
          (checkin) =>
            checkin.habitId === args.where.habitId &&
            checkin.userId === args.where.userId &&
            checkin.date.getTime() === args.where.date.getTime()
        ) ?? null
      );
    },
    upsert: async (args: {
      where: { habit_date_unique: { habitId: string; date: Date } };
      create: Omit<CheckinRecord, 'id'>;
      update: Pick<CheckinRecord, 'done' | 'updatedAt' | 'version'>;
    }) => {
      const { habitId, date } = args.where.habit_date_unique;
      const index = this.checkins.findIndex(
        (checkin) => checkin.habitId === habitId && checkin.date.getTime() === date.getTime()
      );
      if (index === -1) {
        const created: CheckinRecord = { id: randomUUID(), ...args.create };
        this.checkins.push(created);
        return created;
      }
      const updated: CheckinRecord = {
        ...this.checkins[index],
        ...args.update
      };
      this.checkins[index] = updated;
      return updated;
    },
    deleteMany: async (args: { where: { habitId: string; date: Date; userId: string } }) => {
      const before = this.checkins.length;
      this.checkins = this.checkins.filter((checkin) => {
        if (checkin.userId !== args.where.userId) {return true;}
        if (checkin.habitId !== args.where.habitId) {return true;}
        if (checkin.date.getTime() !== args.where.date.getTime()) {return true;}
        return false;
      });
      return { count: before - this.checkins.length };
    }
  };

  tombstone = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.tombstones
        .filter((tombstone) => this.matchesWhere(tombstone, args.where, 'deletedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.deletedAt, b.deletedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    create: async (args: { data: Omit<TombstoneRecord, 'id' | 'deletedAt'> }) => {
      const record: TombstoneRecord = {
        id: randomUUID(),
        deletedAt: new Date(),
        ...args.data
      };
      this.tombstones.push(record);
      return record;
    }
  };

  syncOpLog = {
    create: async (args: { data: { opId: string } }) => {
      if (this.syncOpIds.has(args.data.opId)) {
        throw { code: 'P2002' };
      }
      this.syncOpIds.add(args.data.opId);
      return { opId: args.data.opId };
    }
  };

  async $transaction<T>(callback: (tx: InMemoryPrismaMock) => Promise<T>): Promise<T> {
    return callback(this);
  }

  private compareByTimestampAndId(aTime: Date, bTime: Date, aId: string, bId: string): number {
    const diff = aTime.getTime() - bTime.getTime();
    if (diff !== 0) {return diff;}
    return aId.localeCompare(bId);
  }

  private matchesWhere(
    row: { userId: string; id: string; updatedAt?: Date; deletedAt?: Date },
    where: Record<string, unknown>,
    field: 'updatedAt' | 'deletedAt'
  ): boolean {
    if (typeof where.userId === 'string' && row.userId !== where.userId) {return false;}
    const andClause = Array.isArray(where.AND) ? where.AND[0] : undefined;
    const orClause = andClause && typeof andClause === 'object' ? (andClause as { OR?: unknown }).OR : undefined;
    if (!Array.isArray(orClause) || orClause.length !== 2) {return true;}

    const [first, second] = orClause as Array<Record<string, unknown>>;
    const value = row[field];
    if (!(value instanceof Date)) {return false;}

    const gtDate = this.extractDate(first[field]);
    if (gtDate && value.getTime() > gtDate.getTime()) {return true;}

    const secondField = second[field];
    const equalsDate = this.extractDate(
      typeof secondField === 'object' && secondField !== null
        ? (secondField as { equals?: unknown }).equals
        : undefined
    );
    const idGt = typeof second.id === 'object' && second.id !== null
      ? (second.id as { gt?: unknown }).gt
      : undefined;
    return Boolean(
      equalsDate &&
        value.getTime() === equalsDate.getTime() &&
        typeof idGt === 'string' &&
        row.id > idGt
    );
  }

  private extractDate(value: unknown): Date | null {
    if (typeof value === 'object' && value !== null && 'gt' in value) {
      const gt = (value as { gt?: unknown }).gt;
      return gt instanceof Date ? gt : null;
    }
    if (value instanceof Date) {return value;}
    return null;
  }
}

const prisma = new InMemoryPrismaMock();

@Module({
  controllers: [AuthController, SyncController],
  providers: [
    AuthService,
    AuthGuard,
    SyncService,
    MetricsService,
    {
      provide: PrismaService,
      useValue: prisma
    }
  ]
})
class TestAppModule {}

let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>;
let authController: AuthController;
let syncController: SyncController;
let authGuard: AuthGuard;

before(async () => {
  prisma.reset();
  app = await NestFactory.createApplicationContext(TestAppModule, { logger: false });
  authController = app.get(AuthController);
  syncController = app.get(SyncController);
  authGuard = app.get(AuthGuard);
});

after(async () => {
  await app.close();
});

beforeEach(() => {
  prisma.reset();
});

async function loginAndGetToken(): Promise<string> {
  const loginResult = await authController.login({ email: 'alice@example.com' });
  assert.equal(loginResult.tokenType, 'Bearer');
  assert.equal(typeof loginResult.accessToken, 'string');
  return loginResult.accessToken;
}

function createRequest(token?: string, traceId?: string): {
  req: RequestWithUser;
  responseHeaders: Record<string, string>;
} {
  const responseHeaders: Record<string, string> = {};
  const headers: Record<string, string | undefined> = {
    authorization: token ? `Bearer ${token}` : undefined,
    'x-trace-id': traceId
  };

  const req: RequestWithUser = {
    headers,
    header(name: string) {
      const key = name.toLowerCase();
      const value = this.headers[key];
      return typeof value === 'string' ? value : undefined;
    },
    res: {
      setHeader(name: string, value: string) {
        responseHeaders[name.toLowerCase()] = value;
      }
    }
  };

  return { req, responseHeaders };
}

async function runGuard(req: RequestWithUser): Promise<void> {
  await authGuard.canActivate({
    switchToHttp: () => ({
      getRequest: () => req
    })
  } as never);
}

test('POST /auth/login returns access and refresh tokens for known user', async () => {
  const result = await authController.login({ email: 'alice@example.com' });

  assert.equal(result.tokenType, 'Bearer');
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.refreshToken, 'string');
  assert.equal(result.expiresIn, 3600);
});

test('GET /sync/pull requires auth and returns UnauthorizedException when token is missing', async () => {
  const { req } = createRequest();
  await assert.rejects(() => runGuard(req), (error: unknown) => {
    assert.ok(error instanceof UnauthorizedException);
    return true;
  });
});

test('GET /sync/pull returns sync payload and echoes trace header', async () => {
  const token = await loginAndGetToken();
  const { req, responseHeaders } = createRequest(token, 'trace-abc-123');
  await runGuard(req);

  const result = await syncController.pull(req);

  assert.equal(responseHeaders['x-trace-id'], 'trace-abc-123');
  assert.equal(result.habits.length, 1);
  assert.equal(result.habits[0].id, 'habit-1');
  assert.equal(result.habits[0].version, 1);
  assert.equal(result.checkins.length, 0);
  assert.equal(result.tombstones.length, 0);
  assert.ok(typeof result.nextCursor === 'string');
});

test('POST /sync/push applies upsert and returns conflict for stale update', async () => {
  const token = await loginAndGetToken();
  const { req } = createRequest(token);
  await runGuard(req);

  const first = await syncController.push(req, {
    ops: [
      {
        id: 'op-1',
        type: 'upsert',
        entity: 'habit',
        payload: {
          id: 'habit-1',
          name: 'Read 30 pages',
          description: null,
          color: '#22c55e',
          icon: 'book-open',
          frequency: 'daily',
          targetStreak: 9,
          archived: false,
          tags: ['focus'],
          version: 1,
          createdAt: '2026-03-01T10:00:00.000Z',
          updatedAt: '2026-03-02T10:00:00.000Z'
        }
      }
    ]
  });

  assert.deepEqual(first.applied, ['op-1']);
  assert.equal(first.conflicts.length, 0);

  const second = await syncController.push(req, {
    ops: [
      {
        id: 'op-2',
        type: 'upsert',
        entity: 'habit',
        payload: {
          id: 'habit-1',
          name: 'Read 10 pages',
          description: null,
          color: '#22c55e',
          icon: 'book-open',
          frequency: 'daily',
          targetStreak: 5,
          archived: false,
          tags: ['focus'],
          version: 1,
          createdAt: '2026-03-01T10:00:00.000Z',
          updatedAt: '2026-03-01T09:00:00.000Z'
        }
      }
    ]
  });

  assert.deepEqual(second.applied, []);
  assert.equal(second.conflicts.length, 1);
  assert.equal(second.conflicts[0].opId, 'op-2');
  assert.equal(second.conflicts[0].reason, 'server already has newer habit');
});

test('POST /sync/push handles checkin upsert and stale checkin conflict', async () => {
  const token = await loginAndGetToken();
  const { req } = createRequest(token);
  await runGuard(req);

  const first = await syncController.push(req, {
    ops: [
      {
        id: 'checkin-op-1',
        type: 'upsert',
        entity: 'checkin',
        payload: {
          habitId: 'habit-1',
          date: '2026-03-05T00:00:00.000Z',
          done: true,
          version: 1,
          updatedAt: '2026-03-05T10:00:00.000Z'
        }
      }
    ]
  });

  assert.deepEqual(first.applied, ['checkin-op-1']);
  assert.equal(first.conflicts.length, 0);

  const second = await syncController.push(req, {
    ops: [
      {
        id: 'checkin-op-2',
        type: 'upsert',
        entity: 'checkin',
        payload: {
          habitId: 'habit-1',
          date: '2026-03-05T00:00:00.000Z',
          done: false,
          version: 1,
          updatedAt: '2026-03-05T09:00:00.000Z'
        }
      }
    ]
  });

  assert.deepEqual(second.applied, []);
  assert.equal(second.conflicts.length, 1);
  assert.equal(second.conflicts[0].opId, 'checkin-op-2');
  assert.equal(second.conflicts[0].reason, 'server already has newer checkin');
});

test('POST /sync/push checkin delete creates tombstone and removes checkin from pull', async () => {
  const token = await loginAndGetToken();
  const { req } = createRequest(token);
  await runGuard(req);

  await syncController.push(req, {
    ops: [
      {
        id: 'checkin-op-create',
        type: 'upsert',
        entity: 'checkin',
        payload: {
          habitId: 'habit-1',
          date: '2026-03-06T00:00:00.000Z',
          done: true,
          updatedAt: '2026-03-06T10:00:00.000Z'
        }
      }
    ]
  });

  const removed = await syncController.push(req, {
    ops: [
      {
        id: 'checkin-op-delete',
        type: 'delete',
        entity: 'checkin',
        payload: {
          habitId: 'habit-1',
          date: '2026-03-06T00:00:00.000Z',
          version: 2
        }
      }
    ]
  });

  assert.deepEqual(removed.applied, ['checkin-op-delete']);
  assert.equal(removed.conflicts.length, 0);

  const pulled = await syncController.pull(req);
  assert.equal(
    pulled.checkins.some((checkin) => checkin.habitId === 'habit-1' && checkin.date.startsWith('2026-03-06')),
    false
  );
  assert.equal(pulled.tombstones.some((item) => item.entity === 'checkin'), true);
});

test('POST /sync/push deduplicates duplicate op ids via sync log', async () => {
  const token = await loginAndGetToken();
  const { req } = createRequest(token);
  await runGuard(req);

  const op = {
    id: 'dup-op-1',
    type: 'upsert' as const,
    entity: 'habit' as const,
    payload: {
      id: 'habit-1',
      name: 'Read 40 pages',
      description: null,
      color: '#22c55e',
      icon: 'book-open',
      frequency: 'daily',
      targetStreak: 10,
      archived: false,
      tags: ['focus'],
      version: 1,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-03T10:00:00.000Z'
    }
  };

  const first = await syncController.push(req, { ops: [op] });
  const second = await syncController.push(req, { ops: [op] });

  assert.deepEqual(first.applied, ['dup-op-1']);
  assert.deepEqual(second.applied, []);
  assert.equal(second.conflicts.length, 0);
});

test('GET /sync/pull with since cursor returns only tombstone-heavy delta', async () => {
  const token = await loginAndGetToken();
  const { req } = createRequest(token);
  await runGuard(req);

  const initial = await syncController.pull(req);
  assert.ok(typeof initial.nextCursor === 'string');

  await syncController.push(req, {
    ops: [
      {
        id: 'delta-habit-delete',
        type: 'delete',
        entity: 'habit',
        payload: {
          id: 'habit-1',
          version: 2
        }
      }
    ]
  });

  const delta = await syncController.pull(req, initial.nextCursor);
  assert.equal(delta.habits.length, 0);
  assert.equal(delta.checkins.length, 0);
  assert.equal(delta.tombstones.length, 1);
  assert.equal(delta.tombstones[0].entity, 'habit');
  assert.equal(delta.tombstones[0].entityId, 'habit-1');
});
