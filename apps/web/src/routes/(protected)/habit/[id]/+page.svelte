<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Archive, ArchiveRestore, ArrowLeft, Minus, Pencil, Plus, Snowflake, Trash2 } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import HabitRetroCalendar from '$lib/components/HabitRetroCalendar.svelte';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitsStore } from '$lib/stores/habits';
  import { getUndoContext } from '$lib/stores/undo';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';

  const undoStore = getUndoContext();
  const habitId = $derived(page.params.id);
  let confirmDelete = $state(false);

  const todayKey = $derived($habitsStore.formatDate(new Date()));
  const todayFreezeKey = $derived(completionKeyToCalendarDate(todayKey));
  const habit = $derived($habitsStore.allHabits.find((entry) => entry.id === habitId) ?? null);
  const stats = $derived(habit ? habitsStore.getHabitStats(habit.id) : null);
  const accent = $derived(habit ? HABIT_COLOR_THEMES[habit.color] : null);
  const dailyTarget = $derived(habit ? Math.max(1, habit.dailyTarget ?? 1) : 1);
  const todayCompletionCount = $derived(habit ? (habit.completions[todayKey] ?? 0) : 0);
  const completedToday = $derived(todayCompletionCount >= dailyTarget);
  const isTodayFrozen = $derived(habit ? habit.freezeDays.includes(todayFreezeKey) : false);
  const heatmapDetails = $derived.by(() => {
    if (!habit) {
      return {};
    }

    const label = formatHabitLabel(habit);
    return Object.entries(habit.completions).reduce<Record<string, string[]>>((details, [date, count]) => {
      if ((count ?? 0) >= dailyTarget) {
        details[date] = [label];
      }
      return details;
    }, {});
  });

  async function handleDelete() {
    if (!habit) {
      return;
    }

    const deleted = await habitsStore.deleteHabit(habit.id);
    if (deleted) {
      undoStore.push({
        message: `Habit "${deleted.name}" was deleted`,
        actionLabel: 'Restore',
        onUndo: async () => {
          await habitsStore.restoreHabit(deleted);
        }
      });
    }

    await goto(resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {}));
  }

  function handleToggleArchive() {
    if (!habit) {
      return;
    }

    void habitsStore.updateHabit(habit.id, { archived: !habit.archived });
  }

  async function toggleFreezeToday() {
    if (!habit) {
      return;
    }

    const nextFrozenState = await habitsStore.toggleFreezeDay(habit.id, todayFreezeKey);
    if (nextFrozenState === undefined) {
      return;
    }

    undoStore.push({
      message: nextFrozenState ? 'Habit frozen for today' : 'Habit unfrozen for today'
    });
  }

  async function handleIncrementCompletion() {
    if (!habit) {
      return;
    }

    const previousCount = habit.completions[todayKey] ?? 0;
    const nextCount = Math.min(dailyTarget, previousCount + 1);
    await habitsStore.setCompletionCount(habit.id, todayKey, nextCount);
    undoStore.push({
      message: `Progress ${nextCount}/${dailyTarget}: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await habitsStore.setCompletionCount(habit.id, todayKey, previousCount);
      }
    });
  }

  async function handleDecrementCompletion() {
    if (!habit) {
      return;
    }

    const previousCount = habit.completions[todayKey] ?? 0;
    if (previousCount <= 0) {
      return;
    }

    const nextCount = previousCount - 1;
    await habitsStore.setCompletionCount(habit.id, todayKey, nextCount);
    undoStore.push({
      message: nextCount > 0 ? `Completed ${nextCount}x today: ${habit.name}` : `Reset for today: ${habit.name}`,
      actionLabel: 'Undo',
      onUndo: async () => {
        await habitsStore.setCompletionCount(habit.id, todayKey, previousCount);
      }
    });
  }

  async function handleRetroUpdate(dateKey: string, count: number) {
    if (!habit) return;
    await habitsStore.setCompletionCount(habit.id, dateKey, count);
  }
</script>

<svelte:head>
  <title>Habit Detail - Habbit Runner</title>
</svelte:head>

{#if !habit || !stats || !accent}
  <div class="px-4 py-12">
    <EmptyState title="Habit not found" description="This route is wired, but the requested habit is missing from the local store.">
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
  <div class="min-h-screen bg-bg-primary">
    <section class="sticky top-0 z-20 border-b border-border bg-bg-primary/95 px-4 py-4 backdrop-blur-sm" style:padding-top="calc(var(--safe-area-inset-top, 0px) + 1rem)">
      <div class="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-3">
          <button
            type="button"
            class="mt-0.5 rounded-full border border-border p-2 text-muted transition hover:border-accent hover:text-foreground"
            onclick={() => {
              void goto(resolve<'/(protected)/dashboard'>('/(protected)/dashboard', {}));
            }}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={14} />
          </button>

          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{habit.icon}</span>
              <div class="min-w-0">
                <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">{habit.archived ? 'Archived habit' : 'Habit detail'}</p>
                <h1 class="truncate text-xl font-semibold text-foreground">{habit.name}</h1>
              </div>
            </div>
            {#if habit.description}
              <p class="mt-2 max-w-2xl text-sm text-muted">{habit.description}</p>
            {/if}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            class={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${habit.archived ? 'border-accent-secondary/40 bg-accent-secondary/10 text-accent-secondary' : 'border-border text-muted hover:border-accent hover:text-foreground'}`}
            onclick={handleToggleArchive}
            aria-label={habit.archived ? 'Unarchive habit' : 'Archive habit'}
          >
            {#if habit.archived}
              <ArchiveRestore size={14} />
            {:else}
              <Archive size={14} />
            {/if}
          </button>

          <a
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition hover:border-accent hover:text-foreground"
            href={resolve('/(protected)/habit/[id]/edit', { id: habit.id })}
            aria-label="Edit habit"
          >
            <Pencil size={14} />
          </a>

          <button
            type="button"
            class={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${isTodayFrozen ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-foreground'}`}
            onclick={() => {
              void toggleFreezeToday();
            }}
            aria-label={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
          >
            <Snowflake size={14} />
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-4xl space-y-4 px-4 py-4">
      <section class="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <article class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Completion rate</p>
              <h2 class="mt-2 text-2xl font-semibold text-foreground">{stats.completionRate}%</h2>
              <p class="mt-2 text-sm text-muted">Current streak {stats.currentStreak}d, longest streak {stats.longestStreak}d.</p>
            </div>
            <CompletionRing percentage={stats.completionRate} size={80} strokeWidth={6} color={habit.color} showText={true} />
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-border bg-bg-secondary px-4 py-3">
              <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Completed days</p>
              <p class="mt-2 text-xl font-semibold text-foreground">{stats.completedDays}</p>
            </div>
            <div class="rounded-2xl border border-border bg-bg-secondary px-4 py-3">
              <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Automatism</p>
              <p class="mt-2 text-xl font-semibold text-foreground">{stats.automatismScore}%</p>
            </div>
            <div class="rounded-2xl border border-border bg-bg-secondary px-4 py-3">
              <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Target streak</p>
              <p class="mt-2 text-xl font-semibold text-foreground">{habit.targetStreak}d</p>
            </div>
          </div>
        </article>

        <article class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
          <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Today</p>
          <h2 class="mt-2 text-xl font-semibold text-foreground">{todayCompletionCount}/{dailyTarget}</h2>
          <p class="mt-2 text-sm text-muted">
            {#if completedToday}
              Daily target reached.
            {:else if isTodayFrozen}
              Today is frozen for this habit.
            {:else}
              Add completions or freeze today if you need a recovery day.
            {/if}
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
              onclick={() => {
                void handleIncrementCompletion();
              }}
              disabled={todayCompletionCount >= dailyTarget}
            >
              <Plus size={14} />
              Add +1
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              onclick={() => {
                void handleDecrementCompletion();
              }}
              disabled={todayCompletionCount <= 0}
            >
              <Minus size={14} />
              Remove 1
            </button>
          </div>

          {#if habit.tags.length > 0}
            <div class="mt-5 flex flex-wrap gap-2">
              {#each habit.tags as tag (tag)}
                <span class="rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
        </article>
      </section>

      <section class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Activity heatmap</p>
            <h2 class="mt-2 text-xl font-semibold text-foreground">Last 90 days</h2>
          </div>
          <span class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">{stats.completedDays} completed days</span>
        </div>

        <div class="mt-5">
          <HabitHeatmap completions={habit.completions} dailyTarget={dailyTarget} color={habit.color} dayDetails={heatmapDetails} />
        </div>
      </section>

      <section class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Retro calendar</p>
            <h2 class="mt-2 text-xl font-semibold text-foreground">Edit past records</h2>
          </div>
        </div>
        <div class="mt-5">
          <HabitRetroCalendar {habit} {accent} onUpdate={handleRetroUpdate} />
        </div>
      </section>

      <section class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
        <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Danger zone</p>
        {#if !confirmDelete}
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent-secondary/40 hover:text-accent-secondary"
            onclick={() => {
              confirmDelete = true;
            }}
          >
            <Trash2 size={14} />
            Delete habit
          </button>
        {:else}
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="text-sm text-muted">Delete this habit and remove it from the active list?</span>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
              onclick={() => {
                void handleDelete();
              }}
            >
              <Trash2 size={14} />
              Confirm delete
            </button>
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground"
              onclick={() => {
                confirmDelete = false;
              }}
            >
              Cancel
            </button>
          </div>
        {/if}
      </section>
    </div>
  </div>
{/if}
