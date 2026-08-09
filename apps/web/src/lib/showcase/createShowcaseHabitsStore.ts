import { get, writable } from 'svelte/store';
import type { HabitsStore, HabitUpdateInput, HabitUpsertInput } from '$lib/stores/habits';
import { createHabitsSnapshotFromDomain, type HabitsSnapshot } from '$lib/stores/habits.snapshot';
import { getHabitStats, getTodayCompletionRate } from '$lib/stores/habits.metrics';
import { formatDate } from '$lib/habits/habitStats';
import { findCheckin } from '$lib/stores/habits.storeHelpers';
import { createPortfolioFixture, type ShowcaseFixture } from '$lib/showcase/portfolioFixture';
import { cloneRuntimeState, createHabitFromInput, setCompletionCountInState, toggleFreezeDayInState, updateHabitInState, type HabitRuntimeState } from '$lib/stores/habits.storeCore';
import type { Habit } from '@/types/habit';

export type ShowcaseHabitsStore = HabitsStore & { reset: () => void };

export function createShowcaseHabitsStore(fixture: () => ShowcaseFixture = createPortfolioFixture): ShowcaseHabitsStore {
  const initial = fixture();
  let state: HabitRuntimeState = cloneRuntimeState(initial);
  const store = writable<HabitsSnapshot>(createSnapshot(state));
  const publish = () => store.set(createSnapshot(state));

  return {
    subscribe: store.subscribe,
    async setUserId() { /* The showcase has no account identity. */ },
    async refresh() { /* Refreshing a public demo is intentionally a no-op. */ },
    async toggleCompletion(habitId, date) {
      const key = date ?? formatDate(new Date());
      const current = findCheckin(state.checkins, habitId, key, 'showcase-demo');
      const result = setCompletionCountInState(state, habitId, key, current?.done ? 0 : 1);
      publish();
      return result;
    },
    async setCompletionCount(habitId, date, count) {
      const result = setCompletionCountInState(state, habitId, date, count);
      publish();
      return result;
    },
    async incrementCompletionCount(habitId, date) {
      const current = findCheckin(state.checkins, habitId, date, 'showcase-demo');
      const previousCount = current?.done ? Math.max(1, current.count ?? 1) : 0;
      const result = setCompletionCountInState(state, habitId, date, previousCount + 1);
      publish();
      return { ...result, previousCount, target: state.habits.find((habit) => habit.id === habitId)?.dailyTarget ?? 1 };
    },
    async advanceCompletionCount(habitId, date) { return this.incrementCompletionCount(habitId, date); },
    async addHabit(data: HabitUpsertInput) {
      const habit = createHabitFromInput(data);
      state.habits = [...state.habits, habit];
      publish();
      return habit.id;
    },
    async updateHabit(id: string, data: HabitUpdateInput) {
      updateHabitInState(state, id, data);
      publish();
    },
    async toggleFreezeDay(id: string, date: string) {
      const result = toggleFreezeDayInState(state, id, date);
      publish();
      return result;
    },
    async deleteHabit(id: string) {
      const habit = state.habits.find((item) => item.id === id);
      if (!habit) {
        return undefined;
      }
      state.habits = state.habits.filter((item) => item.id !== id);
      state.checkins = state.checkins.filter((checkin) => checkin.habitId !== id);
      publish();
      return structuredClone(habit) as Habit;
    },
    async restoreHabit(habit: Habit) { state.habits = [...state.habits.filter((item) => item.id !== habit.id), structuredClone(habit) as Habit]; publish(); },
    getHabitStats(habitId) { return getHabitStats(habitId, get(store).allHabits); },
    getTodayCompletionRate() { return getTodayCompletionRate(get(store).habits); },
    reset() { state = cloneRuntimeState(initial); publish(); }
  };
}

function createSnapshot(state: HabitRuntimeState): HabitsSnapshot {
  return createHabitsSnapshotFromDomain(state.habits, state.checkins, { isHydrating: false, hasHydrated: true });
}
