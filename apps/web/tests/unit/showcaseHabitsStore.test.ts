import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { createShowcaseHabitsStore } from '../../src/lib/showcase/createShowcaseHabitsStore';

describe('createShowcaseHabitsStore', () => {
  it('mutates completion state and restores the seed on reset', async () => {
    const store = createShowcaseHabitsStore();
    const initial = get(store);
    const habitId = initial.habits[0].id;

    await store.toggleCompletion(habitId, '2099-01-01');
    expect(get(store).allHabits.find((habit) => habit.id === habitId)?.completions['2099-01-01T00:00:00Z']).toBe(1);

    await store.toggleCompletion(habitId, '2099-01-01');
    expect(get(store).allHabits.find((habit) => habit.id === habitId)?.completions['2099-01-01T00:00:00Z']).toBeUndefined();

    await store.reset();
    expect(get(store).allHabits).toEqual(initial.allHabits);
  });

  it('supports create, edit, archive, delete, restore, reorder and freeze actions', async () => {
    const store = createShowcaseHabitsStore();
    const source = get(store).allHabits[0];
    const createdId = await store.addHabit({
      name: 'Demo habit', description: '', color: 'cyan', icon: '✨', tags: [], frequency: 'daily',
      schedule: { type: 'daily' }, targetStreak: 7, dailyTarget: 1, archived: false,
      sortOrder: -1, type: 'positive', freezeDays: [], reminderEnabled: false
    });
    await store.updateHabit(createdId, { name: 'Updated demo habit', sortOrder: -2 });
    expect(get(store).habits[0].name).toBe('Updated demo habit');
    await store.toggleFreezeDay(createdId, '2099-02-02');
    expect(get(store).allHabits.find((habit) => habit.id === createdId)?.freezeDays).toContain('2099-02-02');
    await store.updateHabit(createdId, { archived: true });
    expect(get(store).habits.some((habit) => habit.id === createdId)).toBe(false);
    const deleted = await store.deleteHabit(source.id);
    expect(deleted?.id).toBe(source.id);
    await store.restoreHabit(deleted!);
    expect(get(store).allHabits.some((habit) => habit.id === source.id)).toBe(true);
  });
});
