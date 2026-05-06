import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HabitEntity } from '$lib/storage/db';

type SubscribeCb = (value: HabitEntity[]) => void;

// Stub dexieLiveQuery to avoid touching IndexedDB during tests
vi.mock('$lib/stores/dexieLiveQuery', () => ({
  dexieLiveQuery: (_query: () => unknown, initialValue: HabitEntity[] | undefined) => ({
    subscribe: (cb: SubscribeCb) => {
      cb(initialValue ?? []);
      return () => undefined;
    }
  })
}));

// Mock storage/db and expose internal mocks via an export so tests can assert calls
vi.mock('$lib/storage/db', () => {
  const mockGet = vi.fn();
  const mockPersist = vi.fn();
  const mockGetCheckinByNaturalKey = vi.fn();
  const mockUpsertCheckinInDb = vi.fn();
  const mockDeleteCheckinInDb = vi.fn();
  const mockEnqueueOutboxEntry = vi.fn();
  const mockTransaction = vi.fn(async (...args: unknown[]) => {
    const callback = args.at(-1);
    if (typeof callback === 'function') {
      return await callback();
    }
    return undefined;
  });

  function entityToDomain(e: HabitEntity) {
    return {
      id: e.id,
      name: e.name,
      description: e.description ?? '',
      color: e.color,
      icon: e.icon,
      frequency: e.frequency,
      targetStreak: e.targetStreak,
      dailyTarget: e.dailyTarget,
      tags: e.tags,
      customDays: e.customDays,
      schedule: e.schedule,
      archived: e.archived,
      completions: e.completions,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      version: e.version,
      sortOrder: e.sortOrder,
      reminderTime: e.reminderTime ?? undefined,
      reminderEnabled: e.reminderEnabled,
      freezeDays: e.freezeDays,
      type: e.type
    };
  }

  return {
    db: {
      habits: { get: mockGet },
      checkins: {},
      outbox: {},
      transaction: mockTransaction
    },
    habitEntityToDomain: entityToDomain,
    persistHabitInDb: mockPersist,
    getCurrentUserId: () => 'test-user',
    setCurrentUserId: () => undefined,
    createOutboxEntry: vi.fn(() => ({ id: 'o' })),
    enqueueOutboxEntry: mockEnqueueOutboxEntry,
    upsertCheckinInDb: mockUpsertCheckinInDb,
    deleteCheckinInDb: mockDeleteCheckinInDb,
    getCheckinByNaturalKey: mockGetCheckinByNaturalKey,
    addTombstone: vi.fn(),
    // helpers for tests
    __mocks: {
      mockGet,
      mockPersist,
      mockGetCheckinByNaturalKey,
      mockUpsertCheckinInDb,
      mockDeleteCheckinInDb,
      mockEnqueueOutboxEntry,
      mockTransaction
    }
  };
});

vi.mock('$lib/sync/writeThrough', () => ({
  syncEntriesWithFallback: vi.fn()
}));

import { createHabitsStore } from '$lib/stores/habits';
import * as dbModule from '$lib/storage/db';

const dbModuleWithMocks = dbModule as typeof dbModule & {
  __mocks: {
    mockGet: ReturnType<typeof vi.fn>;
    mockPersist: ReturnType<typeof vi.fn>;
    mockGetCheckinByNaturalKey: ReturnType<typeof vi.fn>;
    mockUpsertCheckinInDb: ReturnType<typeof vi.fn>;
    mockDeleteCheckinInDb: ReturnType<typeof vi.fn>;
    mockEnqueueOutboxEntry: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
  };
};

describe('habits store - updateHabit', () => {
  beforeEach(() => {
    dbModuleWithMocks.__mocks.mockGet.mockReset();
    dbModuleWithMocks.__mocks.mockPersist.mockReset();
  });

  it('persists updated habit to DB', async () => {
    const entity = {
      id: 'habit-1',
      userId: 'test-user',
      name: 'Old name',
      description: 'old desc',
      color: 'blue',
      icon: '⚡',
      frequency: 'daily',
      targetStreak: 10,
      dailyTarget: 1,
      tags: [],
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
      version: 1,
      sortOrder: 1,
      reminderTime: null,
      reminderEnabled: true,
      freezeDays: [],
      type: 'positive'
    };

    dbModuleWithMocks.__mocks.mockGet.mockResolvedValue(entity);

    const store = createHabitsStore('test-user');
    await store.updateHabit('habit-1', { name: 'New name', dailyTarget: 2 });

    expect(dbModuleWithMocks.__mocks.mockPersist).toHaveBeenCalled();
    const persisted = dbModuleWithMocks.__mocks.mockPersist.mock.calls[0][0];
    expect(persisted.id).toBe('habit-1');
    expect(persisted.name).toBe('New name');
    expect(persisted.dailyTarget).toBe(2);
    expect(persisted.version).toBe(entity.version + 1);
  });
});

describe('habits store - incrementCompletionCount', () => {
  const checkinState = new Map<string, { done: boolean; count: number }>();

  function key(habitId: string, date: string, userId = 'test-user') {
    return `${userId}:${habitId}:${date}`;
  }

  beforeEach(() => {
    dbModuleWithMocks.__mocks.mockGet.mockReset();
    dbModuleWithMocks.__mocks.mockPersist.mockReset();
    dbModuleWithMocks.__mocks.mockGetCheckinByNaturalKey.mockReset();
    dbModuleWithMocks.__mocks.mockUpsertCheckinInDb.mockReset();
    dbModuleWithMocks.__mocks.mockDeleteCheckinInDb.mockReset();
    dbModuleWithMocks.__mocks.mockEnqueueOutboxEntry.mockReset();
    dbModuleWithMocks.__mocks.mockTransaction.mockReset();
    checkinState.clear();

    dbModuleWithMocks.__mocks.mockGet.mockResolvedValue({
      id: 'habit-1',
      userId: 'test-user',
      name: 'Read',
      description: 'books',
      color: 'blue',
      icon: '📚',
      frequency: 'daily',
      targetStreak: 10,
      dailyTarget: 5,
      tags: [],
      createdAt: '2026-03-12T00:00:00.000Z',
      updatedAt: '2026-03-12T00:00:00.000Z',
      version: 1,
      sortOrder: 1,
      reminderTime: null,
      reminderEnabled: true,
      freezeDays: [],
      type: 'positive'
    });

    dbModuleWithMocks.__mocks.mockGetCheckinByNaturalKey.mockImplementation(async (habitId: string, date: string, userId?: string) => {
      return checkinState.get(key(habitId, date, userId)) ?? undefined;
    });

    dbModuleWithMocks.__mocks.mockUpsertCheckinInDb.mockImplementation(async (habitId: string, date: string, done: boolean, count: number) => {
      checkinState.set(key(habitId, date), { done, count });
      return '2026-03-12T10:00:00.000Z';
    });
  });

  it('increments from the persisted DB count on every click', async () => {
    const store = createHabitsStore('test-user');
    const date = '2026-03-12';

    await store.incrementCompletionCount('habit-1', date);
    await store.incrementCompletionCount('habit-1', date);

    expect(dbModuleWithMocks.__mocks.mockUpsertCheckinInDb).toHaveBeenNthCalledWith(
      1,
      'habit-1',
      date,
      true,
      1
    );
    expect(dbModuleWithMocks.__mocks.mockUpsertCheckinInDb).toHaveBeenNthCalledWith(
      2,
      'habit-1',
      date,
      true,
      2
    );
  });
});
