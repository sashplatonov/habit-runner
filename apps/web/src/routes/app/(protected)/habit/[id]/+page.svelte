<script lang="ts">
  type ConfettiFn = typeof import('canvas-confetti');

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onDestroy } from 'svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import StatCardGrid from '$lib/components/StatCardGrid.svelte';
  import AutomatismSection from '$lib/components/AutomatismSection.svelte';
  import MonthlyRateSection from '$lib/components/MonthlyRateSection.svelte';
  import WeeklyCompletionsSection from '$lib/components/WeeklyCompletionsSection.svelte';
  import HabitRetroCalendar from '$lib/components/HabitRetroCalendar.svelte';
  import HabitDetailHeader from '$lib/components/habits/HabitDetailHeader.svelte';
  import HabitTodayStep from '$lib/components/habits/HabitTodayStep.svelte';
  import HabitMomentum from '$lib/components/habits/HabitMomentum.svelte';
  import HabitRecentRhythm from '$lib/components/habits/HabitRecentRhythm.svelte';
  import HabitSettingsSummary from '$lib/components/habits/HabitSettingsSummary.svelte';
  import HabitDangerZone from '$lib/components/habits/HabitDangerZone.svelte';
  import { buildHabitDetailViewModel } from '$lib/habits/habitDetailViewModel';
  import { buildCelebrationParticles, getCelebrationLabel, type CelebrationParticle } from '$lib/habits/completionCelebration';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { calculateScheduledStreak } from '$lib/habits/schedule';
  import { isPhaseTransition } from '$lib/habits/phases';
  import { habitsStore } from '$lib/stores/habits';
  import { getUndoContext } from '$lib/stores/undo';
  import { getCurrentUserTimeZone } from '$lib/time/userTimezone';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';

  const undoStore = getUndoContext();
  const habitId = $derived(page.params.id);
  const timeZone = getCurrentUserTimeZone();
  const referenceDate = new Date();

  let confirmDelete = $state(false);
  let mutationPending = $state(false);
  let mutationError = $state<string | null>(null);

  const todayKey = $derived($habitsStore.formatDate(referenceDate));
  const todayFreezeKey = $derived(completionKeyToCalendarDate(todayKey));
  const habit = $derived($habitsStore.allHabits.find((entry) => entry.id === habitId) ?? null);
  const stats = $derived(habit ? habitsStore.getHabitStats(habit.id) : null);
  const accent = $derived(habit ? HABIT_COLOR_THEMES[habit.color] : null);
  const dailyTarget = $derived(habit ? Math.max(1, habit.dailyTarget ?? 1) : 1);
  const todayCompletionCount = $derived(habit ? (habit.completions[todayKey] ?? 0) : 0);
  const detailModel = $derived(
    buildHabitDetailViewModel(habit, stats, referenceDate, timeZone, {
      pending: mutationPending,
      error: Boolean(mutationError)
    })
  );
  let detailConfetti: ConfettiFn | null = null;
  let detailAnimating = $state(false);
  let detailCelebrationLabel = $state('');
  let detailParticles = $state<CelebrationParticle[]>([]);
  let detailParticleCounter = 0;
  let celebrationTimerIds: ReturnType<typeof setTimeout>[] = [];

  const isResolvingHabit = $derived(!habit && !$habitsStore.hasHydrated);

  function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function scheduleCelebrationTask(task: () => void | Promise<void>, delay: number) {
    const timerId = setTimeout(() => {
      celebrationTimerIds = celebrationTimerIds.filter((candidate) => candidate !== timerId);
      void task();
    }, delay);
    celebrationTimerIds = [...celebrationTimerIds, timerId];
  }

  onDestroy(() => {
    celebrationTimerIds.forEach((timerId) => clearTimeout(timerId));
    celebrationTimerIds = [];
  });

  async function getDetailConfetti() {
    if (detailConfetti) {
      return detailConfetti;
    }

    const mod = await import('canvas-confetti') as ConfettiFn & { default?: ConfettiFn };
    detailConfetti = mod.default ?? mod;
    return detailConfetti;
  }

  async function handleDelete() {
    if (!habit || mutationPending) {
      return;
    }

    mutationPending = true;
    mutationError = null;
    try {
      const deleted = await habitsStore.deleteHabit(habit.id);
      if (deleted) {
        undoStore.push({
          message: `Habit "${formatHabitLabel(deleted)}" was deleted`,
          actionLabel: 'Restore',
          onUndo: async () => {
            await habitsStore.restoreHabit(deleted);
          }
        });
      }

      await goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}));
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to delete habit';
    } finally {
      mutationPending = false;
    }
  }

  async function handleToggleArchive() {
    if (!habit || mutationPending) {
      return;
    }

    mutationPending = true;
    mutationError = null;
    try {
      await habitsStore.updateHabit(habit.id, { archived: !habit.archived });
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to update habit';
    } finally {
      mutationPending = false;
    }
  }

  async function toggleFreezeToday() {
    if (!habit || mutationPending) {
      return;
    }

    mutationPending = true;
    mutationError = null;
    try {
      const nextFrozenState = await habitsStore.toggleFreezeDay(habit.id, todayFreezeKey);
      if (nextFrozenState === undefined) {
        return;
      }

      undoStore.push({
        message: nextFrozenState ? 'Habit frozen for today' : 'Habit unfrozen for today'
      });
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to toggle freeze';
    } finally {
      mutationPending = false;
    }
  }

  async function handleIncrementCompletion() {
    if (!habit || mutationPending) {
      return;
    }

    mutationPending = true;
    mutationError = null;
    try {
      const result = await habitsStore.incrementCompletionCount(habit.id, todayKey);
      const nextCount = result.count;
      const previousCount = result.previousCount;

      if (habit.type === 'positive' && !prefersReducedMotion()) {
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
        const isMilestone = previousCount < dailyTarget && nextCount >= dailyTarget && isPhaseTransition(currentStreak + 1);
        scheduleCelebrationTask(async () => {
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
            // Confetti is optional visual feedback.
          }
        }, 180);

        scheduleCelebrationTask(() => {
          detailAnimating = false;
          detailCelebrationLabel = '';
          detailParticles = [];
        }, 900);
      }

      undoStore.push({
        message: habit.type === 'negative'
          ? `Slip recorded: ${formatHabitLabel(habit)}`
          : `Progress ${nextCount}/${dailyTarget}: ${formatHabitLabel(habit)}`,
        actionLabel: 'Undo',
        onUndo: async () => {
          await habitsStore.setCompletionCount(habit.id, todayKey, previousCount);
        }
      });
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to update completion';
    } finally {
      mutationPending = false;
    }
  }

  async function handleDecrementCompletion() {
    if (!habit || mutationPending) {
      return;
    }

    const previousCount = habit.completions[todayKey] ?? 0;
    if (previousCount <= 0) {
      return;
    }

    mutationPending = true;
    mutationError = null;
    try {
      const nextCount = previousCount - 1;
      await habitsStore.setCompletionCount(habit.id, todayKey, nextCount);
      undoStore.push({
        message: nextCount > 0 ? `Completed ${nextCount}x today: ${formatHabitLabel(habit)}` : `Reset for today: ${formatHabitLabel(habit)}`,
        actionLabel: 'Undo',
        onUndo: async () => {
          await habitsStore.setCompletionCount(habit.id, todayKey, previousCount);
        }
      });
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to update completion';
    } finally {
      mutationPending = false;
    }
  }

  async function handleRetroUpdate(dateKey: string, count: number) {
    if (!habit || mutationPending) return;
    mutationPending = true;
    mutationError = null;
    try {
      await habitsStore.setCompletionCount(habit.id, dateKey, count);
    } catch (err) {
      mutationError = err instanceof Error ? err.message : 'Failed to update history';
    } finally {
      mutationPending = false;
    }
  }

  function handleEdit() {
    if (!habit) {
      return;
    }

    void goto(resolve('/app/(protected)/habit/[id]/edit', { id: habit.id }));
  }

  function handleBack() {
    void goto(resolve<'/app/(protected)/dashboard'>('/app/(protected)/dashboard', {}));
  }
</script>

<svelte:head>
  <title>Habit Detail - Habbit Runner</title>
</svelte:head>

{#if isResolvingHabit}
  <div class="min-h-screen bg-bg-primary">
    <div class="mx-auto max-w-lg px-4 py-12 text-center text-sm font-mono text-muted" role="status" aria-live="polite">
      <h2 class="sr-only">Loading</h2>
      Loading habit…
    </div>
  </div>
{:else if !habit || !stats || !accent}
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
    <div class="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:px-6">
      <HabitDetailHeader
        {habit}
        todayLabel={detailModel.todayLabel}
        descriptionLabel={detailModel.descriptionLabel}
        onBack={handleBack}
        onEdit={handleEdit}
        onToggleArchive={handleToggleArchive}
        pending={mutationPending}
      />

      {#if mutationError}
        <p class="rounded-lg border border-accent-secondary/40 bg-accent-secondary/10 px-3 py-2 text-xs font-mono text-accent-secondary" role="alert">
          {mutationError}
        </p>
      {/if}

      <HabitTodayStep
        {habit}
        label={detailModel.habitLabel}
        completed={detailModel.operationalState === 'complete'}
        target={dailyTarget}
        count={todayCompletionCount}
        accent={accent.hex}
        scheduled={detailModel.isMandatoryToday && !detailModel.isArchived}
        frozen={detailModel.isFrozenToday || detailModel.isArchived}
        pending={mutationPending}
        error={detailModel.hasError}
        summary={detailModel.todaySummary}
        progressLabel={detailModel.progressLabel}
        remainingLabel={detailModel.remainingLabel}
        recoveryCopy={detailModel.recoveryCopy}
        animating={detailAnimating}
        particles={detailParticles}
        celebrationLabel={detailCelebrationLabel}
        onIncrement={handleIncrementCompletion}
        onDecrement={handleDecrementCompletion}
        onToggleFreeze={toggleFreezeToday}
      />

      <HabitMomentum
        streakLabel={detailModel.streakLabel}
        bestLabel={detailModel.bestLabel}
        phaseLabel={detailModel.phaseLabel}
        phaseHint={detailModel.phaseHint}
        completionRateLabel={detailModel.completionRateLabel}
        nextMilestoneLabel={detailModel.nextMilestoneLabel}
        nextMilestoneDays={detailModel.nextMilestoneDays}
      />

      <HabitRecentRhythm cells={detailModel.rhythmCells} />
      <HabitSettingsSummary scheduleSummary={detailModel.scheduleSummary} reminderSummary={detailModel.reminderSummary} onEditSettings={handleEdit} />

      <div class="grid gap-4 xl:grid-cols-[1.12fr,0.88fr]">
        <div class="space-y-4">
          <StatCardGrid stats={stats} {accent} habitCreatedAt={habit.createdAt} />
          <AutomatismSection score={stats.automatismScore} {accent} />
          <MonthlyRateSection monthlyData={stats.monthlyData} {accent} habitCreatedAt={habit.createdAt} />
          <WeeklyCompletionsSection weeklyData={stats.weeklyData} {accent} habitCreatedAt={habit.createdAt} />
        </div>

        <div class="space-y-4">
          <HabitRetroCalendar {habit} {accent} onUpdate={handleRetroUpdate} />
        </div>
      </div>

      <HabitDangerZone
        habitLabel={detailModel.habitLabel}
        archived={habit.archived}
        confirmDelete={confirmDelete}
        pending={mutationPending}
        onToggleArchive={handleToggleArchive}
        onBeginDelete={() => {
          confirmDelete = true;
        }}
        onConfirmDelete={() => {
          void handleDelete();
        }}
        onCancelDelete={() => {
          confirmDelete = false;
        }}
      />
    </div>
  </div>
{/if}
