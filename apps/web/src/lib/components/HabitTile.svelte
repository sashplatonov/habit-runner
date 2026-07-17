<script lang="ts">
  import { Shield, Zap, Activity, Star, Trophy, SnowflakeIcon, Moon } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import HabitCompletionControl from '$lib/components/dashboard/HabitCompletionControl.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { computeTileHint } from '$lib/habits/tileHint';
  import {
    calculateScheduledStreak,
    calculateScheduledCompletionRate,
    getScheduleStatusForDate,
    isMandatoryToday
  } from '$lib/habits/schedule';
  import type { CelebrationParticle } from '$lib/habits/completionCelebration';
  import { getHabitPhase } from '$lib/habits/phases';
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
  const phase = $derived(getHabitPhase(streak));
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
  class="relative overflow-hidden rounded-[1.5rem] border bg-bg-card transition-[border-color,opacity] duration-200 hover:border-border-hover animate-fade-slide-up shadow-[0_12px_28px_rgba(15,23,42,0.06)] {isFrozen ? 'opacity-75 border-border/50' : 'border-border'}"
  style:animation-delay={animDelay}
>
  <!-- Accent bar -->
  <div class="h-[3px] w-full" style:background={accent.hex}></div>

  <div class="p-3 flex flex-col" style="min-height: 120px;">
    <!-- Top row: icon + tooltip + ring -->
    <div class="flex items-center justify-between mb-2">
      <div class="ml-auto flex items-center gap-1">
        <ChartGuideTooltip
          title="{habitLabel} card"
          summary="This card is your quick control surface for one habit: review today's status, recent consistency, and mark progress without opening details."
          focusPoints={[
            'Top-right ring: long-term completion rate for this habit.',
            'Bottom heatmap: recent activity pattern and dead zones.',
            'Action button: log today progress directly from the dashboard.'
          ]}
          variant="grid"
          triggerClassName="h-11 w-11"
        />
        <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
      </div>
    </div>

      <!-- Name + meta -->
    <div class="flex-1 min-w-0 text-left">
      <div class="flex items-center gap-1 leading-tight">
        <button
          type="button"
          class="flex min-h-11 min-w-0 flex-1 items-center text-left text-sm font-semibold transition-colors hover:text-accent {completed ? 'text-muted line-through' : 'text-foreground'}"
          onclick={onDetail}
        >
          <span class="truncate">{habitLabel}</span>
          {#if target > 1}
            <span class="ml-1 flex-shrink-0 rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono font-medium text-accent-secondary">×{target}</span>
          {/if}
        </button>
        {#if habit.description}
          <DescriptionTooltip description={habit.description} triggerClassName="h-11 w-11" />
        {/if}
      </div>

      <!-- Streak with phase icon -->
      <div class="mt-0.5 h-4 flex items-center">
        {#if isFrozen}
          <span class="flex items-center gap-0.5 text-[10px] font-mono text-muted">
            <SnowflakeIcon size={9} /><span>Frozen</span>
          </span>
        {:else if !scheduledToday}
          <span class="flex items-center gap-0.5 text-[10px] font-mono text-muted">
            <Moon size={9} /><span>Not today</span>
          </span>
        {:else if streak > 0}
          {#if habit.type === 'negative'}
            <span class="flex items-center gap-0.5 text-accent-secondary">
              <Trophy size={9} />
              <span class="text-[10px] font-mono">{streak}d</span>
            </span>
          {:else if phase.id === 1}
            <span class="flex items-center gap-0.5 text-accent-secondary">
              <Shield size={9} />
              <span class="text-[10px] font-mono">{streak}d</span>
            </span>
          {:else if phase.id === 2}
            <span class="flex items-center gap-0.5 text-accent-secondary">
              <Zap size={9} />
              <span class="text-[10px] font-mono">{streak}d</span>
            </span>
          {:else if phase.id === 3}
            <span class="flex items-center gap-0.5 text-accent-secondary">
              <Activity size={9} />
              <span class="text-[10px] font-mono">{streak}d</span>
            </span>
          {:else}
            <span class="flex items-center gap-0.5 text-accent-secondary">
              <Star size={9} />
              <span class="text-[10px] font-mono">{streak}d</span>
            </span>
          {/if}
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
    <div class="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
      <HabitHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} compact />

      <!-- Toggle button with particles -->
      <div class="relative flex-shrink-0">
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
