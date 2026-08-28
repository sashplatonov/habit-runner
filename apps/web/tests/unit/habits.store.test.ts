import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const {
  mockFetchHabits,
  mockFetchAllCheckins,
  mockCreateHabit,
  mockUpdateHabit,
  mockUpdateHabitStatus,
  mockDeleteHabit,
  mockUpsertCheckin,
  mockDeleteCheckin,
  mockSetCurrentUserId
} = vi.hoisted(() => ({
  mockFetchHabits: vi.fn(),
  mockFetchAllCheckins: vi.fn(),
  mockCreateHabit: vi.fn(),
  mockUpdateHabit: vi.fn(),
  mockUpdateHabitStatus: vi.fn(),
  mockDeleteHabit: vi.fn(),
  mockUpsertCheckin: vi.fn(),
  mockDeleteCheckin: vi.fn(),
  mockSetCurrentUserId: vi.fn()
}));

vi.mock('$lib/storage/db', () => ({
  getCurrentUserId: () => 'test-user',
  setCurrentUserId: mockSetCurrentUserId
}));

vi.mock('$lib/api/habits', () => ({
  fetchHabits: mockFetchHabits,
  createHabit: mockCreateHabit,
  updateHabit: mockUpdateHabit,
  updateHabitStatus: mockUpdateHabitStatus,
  deleteHabit: mockDeleteHabit
}));

vi.mock('$lib/api/checkins', () => ({
  fetchAllCheckins: mockFetchAllCheckins,
  upsertCheckin: mockUpsertCheckin,
  deleteCheckin: mockDeleteCheckin
}));

import { createHabitsStore } from '$lib/stores/habits';

function buildHabitResponse(overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  frequency: string;
  customDays: number[];
  schedule: unknown;
  targetStreak: number;
  dailyTarget: number;
  tags: string[];
  freezeDays: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  archived: boolean;
  sortOrder: number;
  type: 'positive' | 'negative';
  reminderEnabled: boolean;
  reminderTime: string | null;
}> = {}) {
  return {
    id: 'habit-1',
    name: 'Read',
    description: null,
    color: 'blue',
    icon: '📚',
    frequency: 'daily',
    customDays: [],
    schedule: undefined,
    targetStreak: 10,
    dailyTarget: 3,
    tags: [],
    freezeDays: [],
    createdAt: '2026-07-09T09:00:00Z',
    updatedAt: '2026-07-09T09:00:00Z',
    version: 1,
    archived: false,
    sortOrder: 1,
    type: 'positive' as const,
    reminderEnabled: true,
    reminderTime: null,
    ...overrides
  };
}

function buildCheckinResponse(overrides: Partial<{
  id: string;
  habitId: string;
  date: string;
  done: boolean;
  count: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}> = {}) {
  return {
    id: 'checkin-1',
    habitId: 'habit-1',
    date: '2026-07-09',
    done: true,
    count: 1,
    createdAt: '2026-07-09T10:00:00Z',
    updatedAt: '2026-07-09T10:00:00Z',
    version: 1,
    ...overrides
  };
}

describe('habits store', () => {
  beforeEach(() => {
    mockFetchHabits.mockReset();
    mockFetchAllCheckins.mockReset();
    mockCreateHabit.mockReset();
    mockUpdateHabit.mockReset();
    mockUpdateHabitStatus.mockReset();
    mockDeleteHabit.mockReset();
    mockUpsertCheckin.mockReset();
    mockDeleteCheckin.mockReset();
    mockSetCurrentUserId.mockReset();
  });

  it('hydrates completions from backend refresh using canonical completion keys', async () => {
    mockFetchHabits.mockResolvedValue([
      buildHabitResponse()
    ]);
    mockFetchAllCheckins.mockResolvedValue([
      buildCheckinResponse({ date: '2026-07-09' })
    ]);

    const store = createHabitsStore('test-user');
    await store.refresh();

    const snapshot = get(store);
    expect(snapshot.hasHydrated).toBe(true);
    expect(snapshot.isHydrating).toBe(false);
    expect(snapshot.allHabits).toHaveLength(1);
    expect(snapshot.allHabits[0].completions['2026-07-09T00:00:00Z']).toBe(1);
  });

  it('marks the first backend load as hydrating before habits arrive', async () => {
    let resolveHabits: ((value: ReturnType<typeof buildHabitResponse>[]) => void) | undefined;
    let resolveCheckins: ((value: ReturnType<typeof buildCheckinResponse>[]) => void) | undefined;

    mockFetchHabits.mockReturnValue(new Promise((resolve) => {
      resolveHabits = resolve;
    }));
    mockFetchAllCheckins.mockReturnValue(new Promise((resolve) => {
      resolveCheckins = resolve;
    }));

    const store = createHabitsStore('test-user');
    const refreshPromise = store.refresh();

    const loadingSnapshot = get(store);
    expect(loadingSnapshot.isHydrating).toBe(true);
    expect(loadingSnapshot.hasHydrated).toBe(false);
    expect(loadingSnapshot.allHabits).toHaveLength(0);

    resolveHabits?.([buildHabitResponse()]);
    resolveCheckins?.([]);
    await refreshPromise;

    const hydratedSnapshot = get(store);
    expect(hydratedSnapshot.isHydrating).toBe(false);
    expect(hydratedSnapshot.hasHydrated).toBe(true);
    expect(hydratedSnapshot.allHabits).toHaveLength(1);
  });

  it('does not replace the last snapshot when check-in hydration fails', async () => {
    mockFetchHabits.mockResolvedValue([buildHabitResponse()]);
    mockFetchAllCheckins.mockResolvedValue([buildCheckinResponse()]);

    const store = createHabitsStore('test-user');
    await store.refresh();
    const previousSnapshot = get(store);

    mockFetchHabits.mockResolvedValue([buildHabitResponse({ name: 'Changed' })]);
    mockFetchAllCheckins.mockRejectedValue(new Error('Invalid or repeated check-in cursor'));

    await expect(store.refresh()).rejects.toThrow('Invalid or repeated check-in cursor');
    expect(get(store).allHabits).toEqual(previousSnapshot.allHabits);
    expect(get(store).allHabits[0].name).toBe('Read');
    expect(get(store).allHabits[0].completions['2026-07-09T00:00:00Z']).toBe(1);
  });

  it('increments from the backend-backed in-memory count on repeated clicks', async () => {
    mockUpsertCheckin
      .mockResolvedValueOnce(buildCheckinResponse({ id: 'checkin-1', count: 1 }))
      .mockResolvedValueOnce(buildCheckinResponse({ id: 'checkin-1', count: 2, version: 2 }));

    const store = createHabitsStore('test-user');
    await store.incrementCompletionCount('habit-1', '2026-07-09');
    await store.incrementCompletionCount('habit-1', '2026-07-09');

    expect(mockUpsertCheckin).toHaveBeenNthCalledWith(
      1,
      'habit-1',
      '2026-07-09',
      { done: true, count: 1 }
    );
    expect(mockUpsertCheckin).toHaveBeenNthCalledWith(
      2,
      'habit-1',
      '2026-07-09',
      { done: true, count: 2 }
    );
  });

  it('updates a habit through the backend and keeps the refreshed habit in store state', async () => {
    mockFetchHabits.mockResolvedValue([buildHabitResponse()]);
    mockFetchAllCheckins.mockResolvedValue([]);
    mockUpdateHabit.mockResolvedValue(buildHabitResponse({
      name: 'Deep Work',
      dailyTarget: 2,
      updatedAt: '2026-07-09T11:00:00Z',
      version: 2
    }));

    const store = createHabitsStore('test-user');
    await store.refresh();
    await store.updateHabit('habit-1', { name: 'Deep Work', dailyTarget: 2 });

    const snapshot = get(store);
    expect(snapshot.allHabits[0].name).toBe('Deep Work');
    expect(snapshot.allHabits[0].dailyTarget).toBe(2);
    expect(mockUpdateHabit).toHaveBeenCalledOnce();
  });

  it('preserves an explicit null when clearing a reminder time', async () => {
    mockFetchHabits.mockResolvedValue([buildHabitResponse({ reminderTime: '08:00' })]);
    mockFetchAllCheckins.mockResolvedValue([]);
    mockUpdateHabit.mockResolvedValue(buildHabitResponse({ reminderTime: null, version: 2 }));

    const store = createHabitsStore('test-user');
    await store.refresh();
    await store.updateHabit('habit-1', { reminderTime: null });

    expect(mockUpdateHabit).toHaveBeenCalledWith(
      'habit-1',
      expect.objectContaining({ reminderTime: null })
    );
    expect(get(store).allHabits[0].reminderTime).toBeUndefined();
  });
});
