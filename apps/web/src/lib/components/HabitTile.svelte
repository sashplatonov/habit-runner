<script lang="ts">
  import { Flame, SnowflakeIcon, Moon } from 'lucide-svelte';
  import HabitCompletionControl from '$lib/components/habits/HabitCompletionControl.svelte';
  import HabitStreakPill from '$lib/components/habits/HabitStreakPill.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { computeTileHint } from '$lib/habits/tileHint';
  import {
    calculateScheduledStreak,
    calculateScheduledCompletionRate,
    getScheduleStatusForDate,
    isMandatoryToday
  } from '$lib/habits/schedule';
  import type { CelebrationParticle } from '$lib/habits/completionCelebration';
  import { getDashboardMomentumStatus } from '$lib/habits/dashboardMomentumStatus';
  import {
    getHabitCompletionActionLabel,
    getHabitCompletionState
  } from '$lib/habits/completionState';
  import type { Habit } from '@/types/habit';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

  type Props = {
    habit: Habit;
    todayKey: string;
    todayDate: Date;
    onToggle: () => void;
    onDetail: () => void;
    appearanceIndex?: number;
    animateOnMount?: boolean;
    pending?: boolean;
    error?: boolean;
    animating?: boolean;
    animParticles?: CelebrationParticle[];
    animLabel?: string;
  };

  const {
    habit,
    todayKey,
    todayDate,
    onToggle,
    onDetail,
    appearanceIndex = 0,
    animateOnMount = true,
    pending = false,
    error = false,
    animating = false,
    animParticles = [],
    animLabel = ''
  }: Props = $props();

  const accent = $derived(HABIT_COLOR_THEMES[habit.color]);
  const completionState = $derived(getHabitCompletionState(habit, todayKey));
  const habitLabel = $derived(formatHabitLabel(habit));
  const target = $derived(completionState.target);
  const todayCount = $derived(completionState.count);
  const completed = $derived(completionState.completed);
  const completionLabel = $derived(getHabitCompletionActionLabel(habitLabel, completionState));
  const status = $derived(getScheduleStatusForDate(habit, todayDate));
  const isFrozen = $derived(status === 'frozen');
  const scheduledToday = $derived(status === 'scheduled' && isMandatoryToday(habit, todayDate));
  const streak = $derived(calculateScheduledStreak(habit, habit.completions).current);
  const completionRate = $derived(calculateScheduledCompletionRate(habit, habit.completions));
  const hint = $derived(computeTileHint(habit, completionRate, streak));
  const momentum = $derived(getDashboardMomentumStatus(habit, todayDate));
  const animDelay = $derived(`${Math.min(Math.max(appearanceIndex, 0), 12) * 0.05}s`);

  function handleToggle(e?: MouseEvent) {
    e?.stopPropagation();
    if (isFrozen || pending) {
      return;
    }
    onToggle();
  }
</script>

<article
  aria-label="{habitLabel}, {completed ? 'completed' : 'not completed'}"
  class="relative overflow-hidden rounded-[1.5rem] border bg-bg-card transition-[border-color,opacity] duration-200 hover:border-border-hover {animateOnMount ? 'animate-fade-slide-up' : ''} shadow-[0_12px_28px_rgba(15,23,42,0.06)] {isFrozen ? 'opacity-75 border-border/50' : 'border-border'}"
  style:animation-delay={animateOnMount ? animDelay : undefined}
>
  <!-- Accent bar -->
  <div class="habit-tile-accent h-[3px] w-full" style:background={accent.hex}></div>

  <div class="habit-tile-body flex min-h-[108px] flex-col p-2.5">
    <!-- Name + meta -->
    <div class="habit-tile-content flex-1 min-w-0 text-left">
      <div class="flex min-h-[2.75rem] items-center gap-1 leading-tight">
        <button
          type="button"
          class="flex min-h-11 min-w-0 flex-1 items-center whitespace-normal text-left text-sm font-semibold transition-colors hover:text-accent {completed ? 'text-muted line-through' : 'text-foreground'}"
          onclick={onDetail}
        >
          <span class="line-clamp-2">{habitLabel}</span>
          {#if target > 1}
            <span class="ml-1 flex-shrink-0 rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono font-medium text-accent-secondary">×{target}</span>
          {/if}
        </button>
        {#if habit.description}
          <DescriptionTooltip description={habit.description} triggerClassName="h-11 w-11" />
        {/if}
      </div>

      <!-- Streak and recovery signal -->
      <div class="mt-0.5 h-4 flex items-center">
        {#if isFrozen}
          <span class="flex items-center gap-0.5 text-[10px] font-mono text-muted">
            <SnowflakeIcon size={9} /><span>Frozen</span>
          </span>
        {:else if !scheduledToday}
          <span class="flex items-center gap-0.5 text-[10px] font-mono text-muted">
            <Moon size={9} /><span>Not today</span>
          </span>
        {:else if momentum.kind === 'flame'}
          <span class="flex items-center gap-0.5 text-accent-secondary" aria-label={momentum.label}>
            <Flame size={9} aria-hidden="true" />
            <span class="text-[10px] font-mono">{momentum.streak}d</span>
          </span>
        {:else if momentum.kind === 'ice'}
          <span class="flex items-center gap-0.5 text-sky-500" aria-label={momentum.label}>
            <SnowflakeIcon size={9} aria-hidden="true" />
            <span class="text-[10px] font-mono">{momentum.inactiveScheduledDays}d inactive</span>
          </span>
        {/if}
      </div>

      <!-- Tile hint -->
      {#if hint}
        {@const hintColor = hint.type === 'good' ? 'text-accent' : hint.type === 'warn' ? 'text-accent-secondary' : 'text-muted'}
        <div class="flex items-center gap-0.5 mt-1 truncate {hintColor}">
          <span class="text-[9px] font-mono truncate">{hint.text}</span>
        </div>
      {/if}
    </div>

    <!-- Bottom row: heatmap + toggle -->
    <div class="habit-tile-history mt-1.5 flex items-center gap-2 border-t border-border/30 pt-2">
      <HabitStreakPill {streak} missedScheduledDays={momentum.inactiveScheduledDays} />
      <div
        class="relative z-10 flex min-w-0 flex-1 items-center"
        role="img"
        aria-label="Habit activity for the last 30 days, from 30 days ago through today"
      >
        <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
      </div>

      <!-- Toggle button with particles -->
      <div class="habit-tile-toggle relative flex-shrink-0">
        {#if animating}
          {#each animParticles as p (p.id)}
            <span
              class="completion-burst-particle"
              style="--tx: {p.tx}px; --ty: {p.ty}px; --particle-size: {p.size}px; --particle-rotate: {p.rotation}deg; --particle-delay: {p.delay}ms; --particle-duration: {p.duration}ms; --particle-color: {p.color}; background: {p.color}; border-radius: {p.radius}; left: 50%; top: 50%; margin-left: calc({p.size}px / -2); margin-top: calc({p.size}px / -2);"
            ></span>
          {/each}
          <span class="completion-status-pop" role="status" style="color: {accent.hex}">{animLabel}</span>
        {/if}
        <HabitCompletionControl
          label={isFrozen ? `${habitLabel} is frozen today` : completionLabel}
          completed={completed}
          target={target}
          count={todayCount}
          accent={accent.hex}
          scheduled={scheduledToday}
          frozen={isFrozen}
          {pending}
          {error}
          onToggle={handleToggle}
        />
      </div>
    </div>
  </div>
</article>

<style>
  @media (min-width: 1024px) {
    .habit-tile-accent {
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      height: 100%;
    }

    .habit-tile-body {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto 292px;
      align-items: center;
      gap: 12px;
      min-height: 88px;
      padding: 10px 14px;
    }

    .habit-tile-content {
      grid-column: 2;
      grid-row: 1;
    }

    .habit-tile-history {
      display: contents;
    }

    .habit-tile-history :global(> [data-streak-pill]) {
      grid-column: 3;
      grid-row: 1;
    }

    .habit-tile-history > [role='img'] {
      grid-column: 4;
      grid-row: 1;
    }

    .habit-tile-history :global([data-heatmap-row]) {
      max-width: none;
    }

    .habit-tile-toggle {
      grid-column: 1;
      grid-row: 1;
    }
  }
</style>
