<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitForm from '$lib/components/HabitForm.svelte';
  import { habitsStore } from '$lib/stores/habits';
  import type { HabitUpsertInput } from '$lib/stores/habits';

  const habit = $derived($habitsStore.allHabits.find((entry) => entry.id === page.params.id) ?? null);

  function handleBack() {
    void goto(resolve('/(protected)/habit/[id]', { id: page.params.id }));
  }

  async function handleSubmit(payload: HabitUpsertInput) {
    if (!habit) {
      return;
    }

    await habitsStore.updateHabit(habit.id, payload);
    await goto(resolve('/(protected)/habit/[id]', { id: habit.id }));
  }
</script>

<svelte:head>
  <title>Edit Habit - Habbit Runner</title>
</svelte:head>

{#if !habit}
  <div class="px-4 py-12">
    <EmptyState title="Habit not found" description="The edit route is wired, but the requested habit does not exist in the local store.">
      {#snippet action()}
        <a
          class="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
          href={resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {})}
        >
          Back to dashboard
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <HabitForm mode="edit" habit={habit} onBack={handleBack} onSubmit={handleSubmit} />
{/if}