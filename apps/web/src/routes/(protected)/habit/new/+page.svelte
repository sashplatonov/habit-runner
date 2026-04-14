<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import HabitForm from '$lib/components/HabitForm.svelte';
  import { habitsStore } from '$lib/stores/habits';
  import type { HabitUpsertInput } from '$lib/stores/habits';

  function handleBack() {
    void goto(resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {}));
  }

  async function handleSubmit(payload: HabitUpsertInput) {
    const allHabits = $habitsStore.allHabits;
    const sortOrder =
      allHabits.length > 0
        ? Math.max(...allHabits.map((habit) => habit.sortOrder ?? 0)) + 1
        : 0;
    const habitId = await habitsStore.addHabit({
      ...payload,
      sortOrder
    });

    await goto(resolve('/(protected)/habit/[id]', { id: habitId }));
  }
</script>

<svelte:head>
  <title>New Habit - Habbit Runner</title>
</svelte:head>

<HabitForm mode="create" onBack={handleBack} onSubmit={handleSubmit} />
