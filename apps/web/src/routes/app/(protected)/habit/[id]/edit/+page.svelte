<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitForm from '$lib/components/HabitForm.svelte';
  import { getAppRuntime } from '$lib/app/runtime';
  import type { HabitUpsertInput } from '$lib/stores/habits';

  const runtime = getAppRuntime();
  const habitsStore = runtime.habitsStore;
  const appResolve = runtime.resolve;

  const allHabits = $derived($habitsStore.allHabits);
  const habit = $derived(allHabits.find((entry) => entry.id === page.params.id) ?? null);

  const isResolvingHabit = $derived(!habit && !$habitsStore.hasHydrated);

  function handleBack() {
    void goto(resolve(appResolve('/app/(protected)/habit/[id]', { id: page.params.id }), {}));
  }

  async function handleSubmit(payload: HabitUpsertInput) {
    if (!habit) {
      return;
    }

    const habitId = habit.id;

    await habitsStore.updateHabit(habitId, payload);

    await goto(resolve(appResolve('/app/(protected)/habit/[id]', { id: habitId }), {}));
  }
</script>

<svelte:head>
  <title>Edit Habit - Habit Runner</title>
</svelte:head>

{#if !habit && isResolvingHabit}
  <div class="min-h-screen bg-bg-primary">
    <div class="mx-auto max-w-lg px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">
      <h2 class="sr-only">Loading</h2>
      Loading habit…
    </div>
  </div>
{:else if !habit}
  <div class="px-4 py-12">
    <EmptyState title="Habit not found" description="The requested habit does not exist in the local store.">
      {#snippet action()}
        <a
          class="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
          href={resolve(appResolve('/app/(protected)/dashboard', {}), {})}
        >
          Back to dashboard
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <HabitForm mode="edit" habit={habit} allHabits={allHabits} onBack={handleBack} onSubmit={handleSubmit} />
{/if}
