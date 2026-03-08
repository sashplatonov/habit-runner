import { afterAll, beforeAll, beforeEach, test } from '@jest/globals';
import * as assert from 'node:assert/strict';
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
import { InMemoryPrismaMock } from './in-memory-prisma.mock';
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

beforeAll(async () => {
  prisma.reset();
  app = await NestFactory.createApplicationContext(TestAppModule, { logger: false });
  authController = app.get(AuthController);
  syncController = app.get(SyncController);
  authGuard = app.get(AuthGuard);
});

afterAll(async () => {
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
