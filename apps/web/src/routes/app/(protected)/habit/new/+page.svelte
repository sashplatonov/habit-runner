<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import HabitForm from '$lib/components/HabitForm.svelte';
  import { getAppRuntime } from '$lib/app/runtime';
  import type { HabitUpsertInput } from '$lib/stores/habits';

  const runtime = getAppRuntime();
  const habitsStore = runtime.habitsStore;
  const appResolve = runtime.resolve;

  const allHabits = $derived($habitsStore.allHabits);

  function handleBack() {
    void goto(resolve(appResolve('/app/(protected)/dashboard', {}), {}));
  }

  async function handleSubmit(payload: HabitUpsertInput) {
    const sortOrder =
      allHabits.length > 0
        ? Math.max(...allHabits.map((habit) => habit.sortOrder ?? 0)) + 1
        : 0;
    const habitId = await habitsStore.addHabit({
      ...payload,
      sortOrder
    });

    await goto(resolve(appResolve('/app/(protected)/habit/[id]', { id: habitId }), {}));
  }
</script>

<svelte:head>
  <title>New Habit - Habit Runner</title>
</svelte:head>

<HabitForm mode="create" allHabits={allHabits} onBack={handleBack} onSubmit={handleSubmit} />
