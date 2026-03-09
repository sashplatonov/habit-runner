import { test, expect } from 'vitest';
import { buildCompletionsByHabitId } from '@/hooks/useHabits.helpers';
import type { CheckinEntity } from '@/lib/storage/db';

const baseCheckin = (overrides: Partial<CheckinEntity> = {}): CheckinEntity => ({
  id: 'checkin-1',
  habitId: 'habit-1',
  userId: 'user-1',
  date: '2026-03-01',
  done: true,
  updatedAt: '2026-03-01T00:00:00.000Z',
  version: 1,
  ...overrides
});

test('buildCompletionsByHabitId groups only completed checkins', () => {
  const checkins: CheckinEntity[] = [
    baseCheckin(),
    baseCheckin({ id: 'checkin-2', date: '2026-03-02', done: false }),
    baseCheckin({ id: 'checkin-3', habitId: 'habit-2', date: '2026-03-01' })
  ];

  const result = buildCompletionsByHabitId(checkins);

  expect(result['habit-1']).toEqual({ '2026-03-01': 1 });
  expect(result['habit-2']).toEqual({ '2026-03-01': 1 });
  expect(result['habit-1']['2026-03-02']).toBeUndefined();
});

test('buildCompletionsByHabitId sums counts per date', () => {
  const checkins: CheckinEntity[] = [
    baseCheckin({ id: 'checkin-1', count: 2 }),
    baseCheckin({ id: 'checkin-2', count: 3 })
  ];

  const result = buildCompletionsByHabitId(checkins);

  expect(result['habit-1']).toEqual({ '2026-03-01': 5 });
});

test('buildCompletionsByHabitId returns empty map when no completed checkins', () => {
  const result = buildCompletionsByHabitId([
    baseCheckin({ done: false }),
    baseCheckin({ done: false, habitId: 'habit-2' })
  ]);

  expect(Object.keys(result)).toHaveLength(0);
});
