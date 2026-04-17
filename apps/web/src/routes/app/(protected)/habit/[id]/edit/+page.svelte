<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitForm from '$lib/components/HabitForm.svelte';
  import { habitsStore } from '$lib/stores/habits';
  import type { HabitUpsertInput } from '$lib/stores/habits';

  const allHabits = $derived($habitsStore.allHabits);
  const habit = $derived(allHabits.find((entry) => entry.id === page.params.id) ?? null);

  let isResolvingHabit = $state(true);

  onMount(() => {
    const timerId = window.setTimeout(() => {
      isResolvingHabit = false;
    }, 300);

    return () => {
      window.clearTimeout(timerId);
    };
  });

  function handleBack() {
    void goto(resolve('/app/(protected)/habit/[id]', { id: page.params.id }));
  }

  async function handleSubmit(payload: HabitUpsertInput) {
    if (!habit) {
      return;
    }

    await habitsStore.updateHabit(habit.id, payload);
    await goto(resolve('/app/(protected)/habit/[id]', { id: habit.id }));
  }
</script>

<svelte:head>
  <title>Edit Habit - Habbit Runner</title>
</svelte:head>

{#if !habit && isResolvingHabit}
  <div class="min-h-screen bg-bg-primary">
    <div class="mx-auto max-w-lg px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">
      <h2 class="sr-only">Loading</h2>
      Loading habit...
    </div>
  </div>
{:else if !habit}
  <div class="px-4 py-12">
    <EmptyState title="Habit not found" description="The requested habit does not exist in the local store.">
      {#snippet action()}
        <a
          class="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
          href={resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {})}
        >
          Back to dashboard
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <HabitForm mode="edit" habit={habit} allHabits={allHabits} onBack={handleBack} onSubmit={handleSubmit} />
{/if}