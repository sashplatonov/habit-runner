<script lang="ts">
  import { Shield, Zap, Activity, Star, Trophy, SnowflakeIcon, Moon } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
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
  import { buildCelebrationParticles, getCelebrationLabel, type CelebrationParticle } from '$lib/habits/completionCelebration';
  import { isPhaseTransition, getHabitPhase } from '$lib/habits/phases';
  import type { Habit } from '@/types/habit';

  type Props = {
    habit: Habit;
    todayKey: string;
    todayDate: Date;
    onToggle: () => void;
    onDetail: () => void;
    appearanceIndex?: number;
  };

  type ConfettiFn = typeof import('canvas-confetti');

  const { habit, todayKey, todayDate, onToggle, onDetail, appearanceIndex = 0 }: Props = $props();

  const CONFETTI_COLORS = ['#fff7ed', '#fbbf24', '#fde68a'];

  let animating = $state(false);
  let particles = $state<CelebrationParticle[]>([]);
  let celebrationLabel = $state('');
  let particleIdCounter = 0;
  let confetti: ConfettiFn | null = null;

  const accent = $derived(HABIT_COLOR_THEMES[habit.color]);
  const target = $derived(Math.max(1, habit.dailyTarget ?? 1));
  const todayCount = $derived(habit.completions[todayKey] ?? 0);
  const completed = $derived(todayCount >= target);
  const status = $derived(getScheduleStatusForDate(habit, todayDate));
  const isFrozen = $derived(status === 'frozen');
  const scheduledToday = $derived(status === 'scheduled' && isMandatoryToday(habit, todayDate));
  const streak = $derived(calculateScheduledStreak(habit, habit.completions).current);
  const completionRate = $derived(calculateScheduledCompletionRate(habit, habit.completions));
  const hint = $derived(computeTileHint(habit, completionRate, streak));
  const phase = $derived(getHabitPhase(streak));
  const animDelay = $derived(`${Math.min(Math.max(appearanceIndex, 0), 12) * 0.05}s`);

  async function getConfetti() {
    if (confetti) {
      return confetti;
    }

    const mod = await import('canvas-confetti') as ConfettiFn & { default?: ConfettiFn };
    confetti = mod.default ?? mod;
    return confetti;
  }

  function handleToggle(e: MouseEvent) {
    e.stopPropagation();
    if (isFrozen) { return; }

    if (!completed) {
      animating = true;
      const nextCount = Math.min(target, todayCount + 1);
      celebrationLabel = getCelebrationLabel(nextCount, target);
      const burst = buildCelebrationParticles({
        startId: particleIdCounter,
        colors: [accent.hex, ...CONFETTI_COLORS],
        count: 12,
        spread: 24,
        lift: 12
      });
      particleIdCounter = burst.nextId;
      particles = burst.particles;

      // Small celebratory confetti for every new completion, larger burst on phase transitions
      setTimeout(async () => {
        try {
          const launch = await getConfetti();
          if (isPhaseTransition(streak + 1)) {
            void launch({
              particleCount: 150,
              spread: 160,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFA500', accent.hex],
              zIndex: 1000
            });
          } else {
            // gentler confetti for normal completions
            void launch({
              particleCount: 24,
              angle: 60,
              spread: 82,
              startVelocity: 28,
              origin: { x: 0.42, y: 0.72 },
              colors: [accent.hex, '#fff7ed', '#fbbf24'],
              scalar: 0.86,
              zIndex: 800
            });
            void launch({
              particleCount: 24,
              angle: 120,
              spread: 82,
              startVelocity: 28,
              origin: { x: 0.58, y: 0.72 },
              colors: [accent.hex, '#fff7ed', '#fbbf24'],
              scalar: 0.86,
              zIndex: 800
            });
          }
        } catch {
          // ignore confetti errors (visual only)
        }
      }, 250);

      setTimeout(() => {
        animating = false;
        particles = [];
        celebrationLabel = '';
      }, 900);
    }
    onToggle();
  }
</script>

<div
  role="button"
  tabindex="0"
  aria-label="{habit.name}, {completed ? 'completed' : 'not completed'}"
  class="relative cursor-pointer overflow-hidden rounded-[1.5rem] border bg-bg-card transition-all duration-200 hover:border-border-hover active:scale-[0.97] animate-fade-slide-up shadow-[0_12px_28px_rgba(15,23,42,0.06)] {isFrozen ? 'opacity-75 border-border/50' : 'border-border'}"
  style:animation-delay={animDelay}
  onclick={onDetail}
  onkeydown={(e) => {
    if (e.key === 'Enter') { e.preventDefault(); onDetail(); }
    if (e.key === ' ') { e.preventDefault(); handleToggle(e as unknown as MouseEvent); }
  }}
>
  <!-- Accent bar -->
  <div class="h-[3px] w-full" style:background={accent.hex}></div>

  <div class="p-3 flex flex-col" style="min-height: 120px;">
    <!-- Top row: icon + tooltip + ring -->
    <div class="flex items-center justify-between mb-2">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style:background={accent.dim}
      >
        {habit.icon}
      </div>
      <div class="flex items-center gap-1">
        <ChartGuideTooltip
          title="{habit.name} card"
          summary="This card is your quick control surface for one habit: review today's status, recent consistency, and mark progress without opening details."
          focusPoints={[
            'Top-right ring: long-term completion rate for this habit.',
            'Bottom heatmap: recent activity pattern and dead zones.',
            'Action button: log today progress directly from the dashboard.'
          ]}
          variant="grid"
          triggerClassName="h-7 w-7"
        />
        <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
      </div>
    </div>

    <!-- Name + meta -->
    <div class="flex-1 min-w-0 text-left">
      <div class="flex items-center gap-1 leading-tight">
        <span class="text-sm font-semibold truncate {completed ? 'text-muted line-through' : 'text-foreground'}">
          {habit.name}
          {#if target > 1}
            <span class="ml-1 text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">×{target}</span>
          {/if}
        </span>
        {#if habit.description}
          <DescriptionTooltip description={habit.description} />
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
        {#each particles as p (p.id)}
          <span
            class="completion-burst-particle"
            style="--tx: {p.tx}px; --ty: {p.ty}px; --particle-size: {p.size}px; --particle-rotate: {p.rotation}deg; --particle-delay: {p.delay}ms; --particle-duration: {p.duration}ms; --particle-color: {p.color}; background: {p.color}; border-radius: {p.radius}; left: 50%; top: 50%; margin-left: calc({p.size}px / -2); margin-top: calc({p.size}px / -2);"
          ></span>
        {/each}
        {#if animating}
          <span class="completion-status-pop" style="color: {accent.hex}">{celebrationLabel}</span>
        {/if}
        <button
          type="button"
          onclick={handleToggle}
          disabled={isFrozen}
          class="w-8 h-8 rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 relative overflow-hidden
            {completed ? `${accent.bgClass} ${accent.borderClass}` : scheduledToday ? 'border-border-hover hover:border-muted' : isFrozen ? 'border-border bg-bg-secondary text-muted cursor-not-allowed opacity-60' : 'border border-dashed border-border text-muted hover:border-muted'}
            {animating ? 'animate-check-pulse animate-glow-burst' : ''}"
          style={completed && !isFrozen ? `box-shadow: 0 0 12px ${accent.glow}` : ''}
          aria-label="{scheduledToday ? `Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}` : isFrozen ? 'Frozen today' : `Manual completion for ${habit.name}`}"
        >
          {#if animating}
            <span class="completion-sheen" style="--sheen-color: {accent.hex}"></span>
          {/if}
          <!-- Multi-target fill bars -->
          {#if target > 1}
            {@const cappedCount = Math.min(Math.max(todayCount, 0), target)}
            {@const progressRatio = cappedCount / target}
            <span class="absolute inset-[2px] rounded-[10px] pointer-events-none overflow-hidden" aria-hidden="true">
              <span
                class="absolute inset-y-0 left-0 rounded-[8px] transition-all duration-200"
                style="width: {progressRatio * 100}%; background: linear-gradient(90deg, {accent.hex}88, {accent.hex})"
              ></span>
            </span>
            <span class="absolute inset-[5px] flex items-end gap-[2px] pointer-events-none z-0" aria-hidden="true">
              {#each Array.from({ length: target }, (_, idx) => idx) as idx ('slot-' + idx)}
                <span
                  class="h-full flex-1 rounded-full transition-colors duration-200"
                  style="background-color: {idx < cappedCount ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)'}; opacity: {idx < cappedCount ? 1 : 0.6}"
                ></span>
              {/each}
            </span>
          {/if}

          {#if isFrozen}
            <SnowflakeIcon size={12} class="opacity-70 text-muted z-10 relative" />
          {:else if completed}
            <svg viewBox="0 0 12 12" class="h-4 w-4 z-10 relative" style="color: {accent.textClass ? '' : accent.hex}">
              <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
