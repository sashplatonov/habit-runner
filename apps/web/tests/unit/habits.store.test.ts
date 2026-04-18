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
    db: { habits: { get: mockGet } },
    habitEntityToDomain: entityToDomain,
    persistHabitInDb: mockPersist,
    getCurrentUserId: () => 'test-user',
    setCurrentUserId: () => undefined,
    createOutboxEntry: vi.fn(() => ({ id: 'o' })),
    enqueueOutboxEntry: vi.fn(),
    upsertCheckinInDb: vi.fn(),
    deleteCheckinInDb: vi.fn(),
    addTombstone: vi.fn(),
    // helpers for tests
    __mocks: { mockGet, mockPersist }
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
