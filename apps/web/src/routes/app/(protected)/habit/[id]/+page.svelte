<script lang="ts">
  type ConfettiFn = typeof import('canvas-confetti');

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Archive, ArchiveRestore, ArrowLeft, Pencil, Snowflake, Trash2 } from 'lucide-svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import HabitRetroCalendar from '$lib/components/HabitRetroCalendar.svelte';
  import StatCardGrid from '$lib/components/StatCardGrid.svelte';
  import AutomatismSection from '$lib/components/AutomatismSection.svelte';
  import TodayBlock from '$lib/components/TodayBlock.svelte';
  import TargetRingSection from '$lib/components/TargetRingSection.svelte';
  import MonthlyRateSection from '$lib/components/MonthlyRateSection.svelte';
  import WeeklyCompletionsSection from '$lib/components/WeeklyCompletionsSection.svelte';
  import { buildCelebrationParticles, getCelebrationLabel, type CelebrationParticle } from '$lib/habits/completionCelebration';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { calculateScheduledStreak } from '$lib/habits/schedule';
  import { isPhaseTransition } from '$lib/habits/phases';
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
  const completionEntryCount = $derived(habit ? Object.keys(habit.completions).length : 0);
  const completedToday = $derived(todayCompletionCount >= dailyTarget);
  const canIncrement = $derived(todayCompletionCount < dailyTarget);
  const isTodayFrozen = $derived(habit ? habit.freezeDays.includes(todayFreezeKey) : false);
  let detailConfetti: ConfettiFn | null = null;
  let detailAnimating = $state(false);
  let detailCelebrationLabel = $state('');
  let detailParticles = $state<CelebrationParticle[]>([]);
  let detailParticleCounter = 0;

  async function getDetailConfetti() {
    if (detailConfetti) {
      return detailConfetti;
    }

    const mod = await import('canvas-confetti') as ConfettiFn & { default?: ConfettiFn };
    detailConfetti = mod.default ?? mod;
    return detailConfetti;
  }

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

    await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}));
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

    if (nextCount > previousCount) {
      detailAnimating = true;
      detailCelebrationLabel = getCelebrationLabel(nextCount, dailyTarget);
      const burst = buildCelebrationParticles({
        startId: detailParticleCounter,
        colors: [accent?.hex ?? '#f8fafc', '#fff7ed', '#fbbf24'],
        count: 12,
        spread: 30,
        lift: 18
      });
      detailParticles = burst.particles;
      detailParticleCounter = burst.nextId;

      const currentStreak = calculateScheduledStreak(habit, habit.completions).current;
      const isMilestone = nextCount >= dailyTarget && isPhaseTransition(currentStreak + 1);
      setTimeout(async () => {
        try {
          const launch = await getDetailConfetti();
          if (isMilestone) {
            void launch({
              particleCount: 180,
              spread: 165,
              startVelocity: 42,
              origin: { y: 0.18 },
              colors: [accent?.hex ?? '#f8fafc', '#fbbf24', '#fff7ed'],
              zIndex: 1000
            });
          } else {
            void launch({
              particleCount: 24,
              angle: 60,
              spread: 82,
              startVelocity: 28,
              origin: { x: 0.42, y: 0.2 },
              colors: [accent?.hex ?? '#f8fafc', '#fff7ed', '#fbbf24'],
              scalar: 0.86,
              zIndex: 900
            });
            void launch({
              particleCount: 24,
              angle: 120,
              spread: 82,
              startVelocity: 28,
              origin: { x: 0.58, y: 0.2 },
              colors: [accent?.hex ?? '#f8fafc', '#fff7ed', '#fbbf24'],
              scalar: 0.86,
              zIndex: 900
            });
          }
        } catch {
          // ignore confetti errors (visual only)
        }
      }, 180);

      setTimeout(() => {
        detailAnimating = false;
        detailCelebrationLabel = '';
        detailParticles = [];
      }, 900);
    }

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
          href={resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {})}
        >
          Back to dashboard
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <div class="min-h-screen bg-transparent">
    <section class="sticky top-0 z-20 bg-transparent px-4 pt-4 sm:px-6" style:padding-top="calc(var(--safe-area-inset-top, 0px) + 1rem);">
      <div class="mx-auto flex max-w-5xl flex-col gap-3 rounded-[1.75rem] border border-border bg-bg-secondary/90 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:flex-row sm:items-center sm:px-5">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            class="-ml-1 flex-shrink-0 p-1 text-muted transition-colors hover:text-foreground"
            onclick={() => {
              void goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}));
            }}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          <span class="flex-shrink-0 text-xl">{habit.icon}</span>

          <div class="min-w-0 flex-1">
            <h1 class="break-words text-base font-semibold text-foreground sm:truncate">{habit.name}</h1>
            {#if habit.description}
              <div class="flex min-w-0 items-center gap-1">
                <p class="truncate text-[11px] text-muted">{habit.description}</p>
                <DescriptionTooltip description={habit.description} />
              </div>
            {/if}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            class={`rounded border p-1.5 transition-colors ${habit.archived ? 'border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary/20' : 'border-border text-muted hover:border-border-hover hover:text-foreground'}`}
            onclick={handleToggleArchive}
            aria-label={habit.archived ? 'Unarchive habit' : 'Archive habit'}
            title={habit.archived ? 'Unarchive' : 'Archive'}
          >
            {#if habit.archived}
              <ArchiveRestore size={13} />
            {:else}
              <Archive size={13} />
            {/if}
          </button>

          <a
            class="rounded border border-border p-1.5 text-muted transition-colors hover:border-border-hover hover:text-foreground"
            href={resolve('/app/(protected)/habit/[id]/edit', { id: habit.id })}
            aria-label="Edit habit"
          >
            <Pencil size={13} />
          </a>

          <div class="relative">
            {#if detailAnimating}
              {#each detailParticles as p (p.id)}
                <span
                  class="completion-burst-particle"
                  style="--tx: {p.tx}px; --ty: {p.ty}px; --particle-size: {p.size}px; --particle-rotate: {p.rotation}deg; --particle-delay: {p.delay}ms; --particle-duration: {p.duration}ms; --particle-color: {p.color}; background: {p.color}; border-radius: {p.radius}; left: 50%; top: 50%; margin-left: calc({p.size}px / -2); margin-top: calc({p.size}px / -2);"
                ></span>
              {/each}
              <span class="completion-status-pop" style="color: {accent.hex}">{detailCelebrationLabel}</span>
            {/if}
            <button
              type="button"
              class="relative overflow-hidden rounded border px-3 py-1.5 text-xs font-mono font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 {completedToday ? 'border-border bg-transparent text-muted' : 'font-bold text-bg-primary'} {detailAnimating ? 'animate-check-pulse animate-glow-burst' : ''}"
              style={!completedToday ? `background-color: ${accent.hex}; border-color: ${accent.hex}; box-shadow: 0 0 16px ${accent.glow};` : ''}
              onclick={() => {
                void handleIncrementCompletion();
              }}
              disabled={!canIncrement}
              aria-label={completedToday ? 'Habit completed today' : 'Mark as completed today'}
            >
              {#if detailAnimating}
                <span class="completion-sheen" style="--sheen-color: {accent.hex}"></span>
              {/if}
              {completedToday ? 'Done' : 'Add +1'}
            </button>
          </div>

          <button
            type="button"
            class="rounded border border-border px-3 py-1.5 text-xs font-mono font-medium text-muted transition hover:border-border-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            onclick={() => {
              void handleDecrementCompletion();
            }}
            disabled={todayCompletionCount <= 0}
            aria-label="Remove one completion for today"
          >
            -1
          </button>

          <button
            type="button"
            class={`inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded border transition-colors ${isTodayFrozen ? 'border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,255,255,0.08)]' : 'border-border text-muted hover:border-border-hover hover:text-foreground'}`}
            onclick={() => {
              void toggleFreezeToday();
            }}
            aria-label={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
            title={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
          >
            <Snowflake size={11} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:px-6">
      <div class="grid gap-4 xl:grid-cols-[1.12fr,0.88fr]">
        <div class="space-y-4">
          <StatCardGrid {stats} {accent} habitCreatedAt={habit.createdAt} />
          <AutomatismSection score={stats.automatismScore} {accent} />
          <TodayBlock {dailyTarget} {todayCompletionCount} {accent} />
        </div>

        <div class="space-y-4">
      <section class="space-y-3 rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Activity - 90 days</h2>
            <ChartGuideTooltip
              title="Habit activity heatmap"
              summary="This block shows how often this habit was completed over the last 90 days, making consistency and missed stretches easy to spot."
              focusPoints={[
                'Bright runs: streaks where the habit was part of your routine.',
                'Sparse patches: periods where the habit slipped out of context.',
                'Recent density: whether the habit is getting stronger right now.'
              ]}
              variant="grid"
            />
          </div>
          <span class="text-[10px] font-mono text-muted">{completionEntryCount} completions</span>
        </div>

        <div class="mx-auto w-full lg:max-w-[560px]">
          <HabitHeatmap completions={habit.completions} dailyTarget={dailyTarget} color={habit.color} dayDetails={heatmapDetails} />
        </div>
      </section>

          <TargetRingSection {stats} {habit} {accent} />
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <MonthlyRateSection monthlyData={stats.monthlyData} {accent} habitCreatedAt={habit.createdAt} />
        <WeeklyCompletionsSection weeklyData={stats.weeklyData} {accent} habitCreatedAt={habit.createdAt} />
      </div>

      <HabitRetroCalendar {habit} {accent} onUpdate={handleRetroUpdate} />

      <section class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Danger zone</p>
        {#if !confirmDelete}
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded border border-accent/20 px-3 py-2 text-xs font-mono text-accent transition-colors hover:border-accent/40 hover:text-accent-secondary"
            onclick={() => {
              confirmDelete = true;
            }}
          >
            <Trash2 size={12} />
            Delete habit
          </button>
        {:else}
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <span class="text-xs font-mono text-muted">Are you sure?</span>
            <button
              type="button"
              class="rounded border border-accent/40 px-3 py-1.5 text-xs font-mono text-accent transition-colors hover:bg-accent/10"
              onclick={() => {
                void handleDelete();
              }}
            >
              Delete
            </button>
            <button
              type="button"
              class="rounded border border-border px-3 py-1.5 text-xs font-mono text-muted transition-colors hover:text-foreground"
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
