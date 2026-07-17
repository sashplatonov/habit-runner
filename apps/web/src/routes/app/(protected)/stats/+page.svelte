<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowRight, CalendarDays, Flame, Plus, RefreshCcw, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import MetricTile from '$lib/components/ui/MetricTile.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
  import StatusPill from '$lib/components/ui/StatusPill.svelte';
  import Surface from '$lib/components/ui/Surface.svelte';
  import { habitsStore } from '$lib/stores/habits';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { buildModernStatsSnapshot, type StatsWindowId } from '$lib/stats/modernStats';

  const windowOptions = [
    { id: '4w', label: '4 weeks' },
    { id: '12w', label: '12 weeks' }
  ] as const;

  let windowId = $state<StatsWindowId>('12w');

  const activeHabits = $derived($habitsStore.allHabits.filter((habit) => !habit.archived));
  const snapshot = $derived.by(() => buildModernStatsSnapshot(activeHabits, windowId));
  const emptyState = $derived(activeHabits.length === 0);
  const patternTone = $derived(snapshot.pattern?.tone ?? 'neutral');
  const trendTone = $derived(
    snapshot.trendDelta === null
      ? 'neutral'
      : snapshot.trendDelta >= 8
        ? 'progress'
        : snapshot.trendDelta <= -8
          ? 'attention'
          : 'neutral'
  );
</script>

<svelte:head>
  <title>Progress - Habit Runner</title>
</svelte:head>

{#if emptyState}
  <div class="px-4 py-10 sm:px-6">
    <EmptyState
      title="No progress data yet"
      description="Create a habit and complete a few scheduled days. The new progress screen will then show trends, patterns, and milestones."
    >
      {#snippet icon()}
        <Sparkles size={34} />
      {/snippet}
      {#snippet action()}
        <a
          class="inline-flex items-center justify-center rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
          href={resolve('/app/(protected)/habit/new', {})}
        >
          Add habit
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <div class="px-4 py-5 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <Surface
        as="section"
        padding="lg"
        class="bg-bg-card"
        style="background: linear-gradient(135deg, var(--bg-card), color-mix(in srgb, var(--bg-card) 84%, var(--progress) 16%));"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <StatusPill tone="progress">
              <Sparkles size={12} />
              Progress
            </StatusPill>
            <h1 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple progress that pushes you forward.
            </h1>
            <p class="mt-3 max-w-xl text-base leading-7 text-muted">
              One screen, one answer: how you are moving now, what changed versus the previous window, and where the next small win sits.
            </p>
          </div>

          <div class="flex flex-col items-start gap-3 lg:items-end">
            <SegmentedControl
              options={windowOptions}
              value={windowId}
              ariaLabel="Statistics window"
              onChange={(next) => { windowId = next as StatsWindowId; }}
            />
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <a
                href={resolve('/app/(protected)/habit/new', {})}
                class="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-4 py-2 font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                <Plus size={14} />
                Add habit
              </a>
              <a
                href={resolve('/app/(protected)/dashboard', {})}
                class="inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 py-2 font-medium text-muted transition-colors hover:text-foreground"
              >
                Back to today
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </Surface>

      <section class="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <Surface as="article" padding="lg" class="min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">Momentum</p>
              <h2 class="mt-2 text-xl font-semibold tracking-tight text-foreground">Your current pace</h2>
            </div>
            <StatusPill tone={trendTone}>
              {#if snapshot.trendDelta === null}
                <RefreshCcw size={12} />
                Low data
              {:else if snapshot.trendDelta >= 8}
                <TrendingUp size={12} />
                Rising
              {:else if snapshot.trendDelta <= -8}
                <TrendingDown size={12} />
                Slipping
              {:else}
                <RefreshCcw size={12} />
                Steady
              {/if}
            </StatusPill>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <MetricTile
              label="Momentum"
              value={snapshot.momentum === null ? '—' : `${snapshot.momentum}%`}
              detail={snapshot.momentum === null
                ? 'Complete five scheduled opportunities to unlock momentum.'
                : 'Weighted toward the latest 14 scheduled opportunities.'}
              tone="progress"
              icon={Flame}
            />
            <MetricTile
              label="Weekly progress"
              value={snapshot.weeklyProgress === null ? '—' : `${snapshot.weeklyProgress}%`}
              detail={snapshot.weeklyProgress === null
                ? 'No scheduled opportunities have occurred this week.'
                : 'Completed scheduled opportunities since Monday.'}
              tone="progress"
              icon={CalendarDays}
            />
            <MetricTile
              label="Trend"
              value={snapshot.trendDelta === null
                ? '—'
                : `${snapshot.trendDelta > 0 ? '+' : ''}${snapshot.trendDelta} pp`}
              detail={snapshot.trendLabel === 'insufficient-data'
                ? `Need five opportunities in both windows; currently ${snapshot.trendSample.current} and ${snapshot.trendSample.previous}.`
                : snapshot.trendLabel === 'rising'
                ? 'Better than the previous comparable window.'
                : snapshot.trendLabel === 'slipping'
                  ? 'Needs one simpler next action.'
                  : 'Close to the previous window.'}
              tone={trendTone}
              icon={TrendingUp}
            />
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <Surface as="div" padding="md" class="bg-bg-secondary">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Weekly quest</p>
                  <h3 class="mt-2 text-lg font-semibold text-foreground">Fill the scheduled opportunities</h3>
                </div>
                <StatusPill tone="progress">
                  <Target size={12} />
                  Quest
                </StatusPill>
              </div>
              <div class="mt-4">
                <ProgressBar value={snapshot.weeklyProgress ?? 0} label="Current week completion" />
              </div>
              <p class="mt-3 text-sm leading-6 text-muted">
                {snapshot.comebackLabel}. The screen only counts scheduled chances, so gaps stay honest.
              </p>
            </Surface>

            <Surface as="div" padding="md" class="bg-bg-secondary">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Next milestone</p>
                  <h3 class="mt-2 text-lg font-semibold text-foreground">The next checkpoint</h3>
                </div>
                <StatusPill tone="neutral">
                  <Sparkles size={12} />
                  Unlock
                </StatusPill>
              </div>
              <div class="mt-4 rounded-[1.25rem] border border-border bg-bg-card p-4">
                <p class="text-3xl font-semibold tracking-tight text-foreground">
                  {snapshot.nextMilestone ?? '—'}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted">
                  {snapshot.nextMilestone
                    ? `Reach ${snapshot.nextMilestone} consecutive scheduled completions to unlock the next milestone.`
                    : 'No active streak yet, so the next milestone will appear after the first reliable run.'}
                </p>
              </div>
            </Surface>
          </div>
        </Surface>

        <div class="flex min-w-0 flex-col gap-4">
          <Surface as="article" padding="md">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Pattern</p>
                <h2 class="mt-2 text-lg font-semibold text-foreground">When the habit slips</h2>
              </div>
              <StatusPill tone={patternTone}>
                <CalendarDays size={12} />
                {snapshot.pattern?.title ?? 'Low data'}
              </StatusPill>
            </div>

            {#if snapshot.pattern}
              <div class="mt-4 rounded-[1.25rem] border border-border bg-bg-secondary p-4">
                <p class="text-sm font-medium text-foreground">{snapshot.pattern.label}</p>
                <p class="mt-2 text-sm leading-6 text-muted">{snapshot.pattern.detail}</p>
                <p class="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">{snapshot.pattern.sample}</p>
              </div>
            {:else}
              <p class="mt-4 text-sm leading-6 text-muted">
                Not enough scheduled data yet. This block only appears when the pattern is stable enough to trust.
              </p>
            {/if}
          </Surface>

          <Surface as="article" padding="md">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Recovery</p>
                <h2 class="mt-2 text-lg font-semibold text-foreground">Habits worth your attention</h2>
              </div>
              <StatusPill tone="attention">
                <RefreshCcw size={12} />
                Rebound
              </StatusPill>
            </div>
            <p class="mt-4 text-sm leading-6 text-muted">
              {snapshot.focusHabits.length > 0
                ? `A balanced view of what is strong, improving, and ready for a smaller next step.`
                : 'No active habits are available for focus.'}
            </p>
            <div class="mt-4 space-y-3">
              {#each snapshot.focusHabits as habit (habit.id)}
                <a
                  href={resolve('/app/(protected)/habit/[id]', { id: habit.habit.id })}
                  class="block rounded-[1.25rem] border border-border bg-bg-card p-4 transition-colors hover:border-accent/35 hover:bg-bg-secondary"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-foreground">{formatHabitLabel(habit.habit)}</p>
                      <p class="mt-1 text-xs text-muted">{habit.label}</p>
                    </div>
                    <StatusPill tone={habit.focus === 'support' ? 'attention' : 'progress'}>
                      {habit.completionRate}%
                    </StatusPill>
                  </div>
                  <div class="mt-3">
                    <ProgressBar value={habit.completionRate} />
                  </div>
                  <div class="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span>{habit.currentStreak}d streak</span>
                    <span>•</span>
                    <span>{habit.completionDelta === null
                      ? 'Not enough prior data'
                      : `${habit.completionDelta > 0 ? '+' : ''}${habit.completionDelta} pp vs previous window`}</span>
                    <span>•</span>
                    <span>Next milestone: {habit.milestone ?? '—'}</span>
                  </div>
                </a>
              {/each}
            </div>
          </Surface>
        </div>
      </section>

      <Surface as="section" padding="lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">History</p>
            <h2 class="mt-2 text-xl font-semibold tracking-tight text-foreground">Compact view of the last window</h2>
          </div>
          <StatusPill tone="neutral">
            {snapshot.history.length} weeks
          </StatusPill>
        </div>

        <div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {#each snapshot.history as week, weekIndex (week.label + '-' + weekIndex)}
            <div class="rounded-[1.25rem] border border-border bg-bg-secondary p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-foreground">{week.label}</p>
                  <p class="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">{week.completedDays}/{week.scheduledDays} completed</p>
                </div>
                <span class="text-sm font-semibold text-foreground">{week.completionRate}%</span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-border">
                <div class="h-full rounded-full bg-progress" style:width={`${week.completionRate}%`}></div>
              </div>
            </div>
          {/each}
        </div>
      </Surface>
    </div>
  </div>
{/if}
