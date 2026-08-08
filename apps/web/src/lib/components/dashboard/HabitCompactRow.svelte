<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Habit } from '@/types/habit';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { getDashboardMomentumStatus } from '$lib/habits/dashboardMomentumStatus';
  import { computeTileHint } from '$lib/habits/tileHint';
  import { calculateScheduledStreak, calculateScheduledCompletionRate } from '$lib/habits/schedule';
  import { getScheduleStatusForDate, isMandatoryToday } from '$lib/habits/schedule';
  import { formatAppDate } from '$lib/i18n';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import HabitCompletionControl from '$lib/components/habits/HabitCompletionControl.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import type { CelebrationParticle } from '$lib/habits/completionCelebration';
  import {
    getHabitCompletionActionLabel,
    getHabitCompletionState
  } from '$lib/habits/completionState';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

  type DropHint = { habitId: string; position: 'above' | 'below' } | null;

  const dispatch = createEventDispatcher<{
    toggle: void;
    detail: void;
    dragstart: DragEvent;
    dragover: DragEvent;
    dragleave: DragEvent;
    drop: DragEvent;
    dragend: DragEvent;
    touchstart: TouchEvent;
    touchmove: TouchEvent;
    touchend: TouchEvent;
    touchcancel: TouchEvent;
    gripTouchStart: TouchEvent;
  }>();

  export let habit: Habit;
  export let todayKey: string;
  export let todayDate: Date;
  export let appearanceIndex: number;
  export let isDragActive: boolean;
  export let dragId: string | null;
  export let dropHint: DropHint;
  export let animatingHabitId: string | null;
  export let animParticles: CelebrationParticle[];
  export let animLabel: string;
  export let swipeHabitId: string;
  export let swipeOffset: number;
  export let swipeDirection: 'left' | 'right' | null;
  export let isSwipingGesture: boolean;
  export let isDragOver: boolean;
  export let pending: boolean;
  export let error: boolean;

  $: accent = HABIT_COLOR_THEMES[habit.color] ?? HABIT_COLOR_THEMES.blue;
  $: completionState = getHabitCompletionState(habit, todayKey);
  $: habitLabel = formatHabitLabel(habit);
  $: tgt = completionState.target;
  $: todayCount = completionState.count;
  $: completed = completionState.completed;
  $: completionLabel = getHabitCompletionActionLabel(habitLabel, completionState);
  $: status = getScheduleStatusForDate(habit, todayDate);
  $: isFrozen = status === 'frozen';
  $: isScheduled = isMandatoryToday(habit, todayDate);
  $: streak = calculateScheduledStreak(habit, habit.completions).current;
  $: completionRate = calculateScheduledCompletionRate(habit, habit.completions);
  $: last7 = Array.from({ length: 7 }, (_, i) => {
    const key = formatAppDate(new Date(todayDate.getTime() + (i - 6) * 86_400_000), {
      month: 'short',
      day: 'numeric'
    });
    return (habit.completions[key] ?? 0) >= tgt;
  });
  $: hint = computeTileHint(habit, completionRate, streak);
  $: momentum = getDashboardMomentumStatus(habit, todayDate);
  $: isAnimating = animatingHabitId === habit.id;
  $: dropHintPosition = dropHint?.habitId === habit.id ? dropHint.position : null;
  $: showDropAbove = dropHintPosition === 'above';
  $: showDropBelow = dropHintPosition === 'below';
  $: dropTransformClass = dropHintPosition === 'above' ? '-translate-y-2' : dropHintPosition === 'below' ? 'translate-y-2' : '';
  $: isSwipeRow = swipeHabitId === habit.id;
  $: indicatorOpacity = isSwipeRow ? Math.min(1, Math.abs(swipeOffset) / 120) : 0;
  $: indicatorColor = swipeDirection === 'right' ? 'rgba(16, 185, 129, 0.25)' : swipeDirection === 'left' ? 'rgba(59, 130, 246, 0.25)' : 'transparent';
  $: inlineTags = habit.tags.slice(0, 3);
  $: extraTagCount = Math.max(0, habit.tags.length - inlineTags.length);

  function handleToggle(e?: MouseEvent | TouchEvent) {
    e?.stopPropagation();
    dispatch('toggle');
  }

  function handleDetail() {
    dispatch('detail');
  }

  function handleDragStart(e: DragEvent) {
    dispatch('dragstart', e);
  }

  function handleDragOver(e: DragEvent) {
    dispatch('dragover', e);
  }

  function handleDragLeave(e: DragEvent) {
    dispatch('dragleave', e);
  }

  function handleDrop(e: DragEvent) {
    dispatch('drop', e);
  }

  function handleDragEnd(e: DragEvent) {
    dispatch('dragend', e);
  }

  function handleTouchStart(e: TouchEvent) {
    dispatch('touchstart', e);
  }

  function handleTouchMove(e: TouchEvent) {
    dispatch('touchmove', e);
  }

  function handleTouchEnd(e: TouchEvent) {
    dispatch('touchend', e);
  }

  function handleTouchCancel(e: TouchEvent) {
    dispatch('touchcancel', e);
  }

  function handleGripTouchStart(e: TouchEvent) {
    dispatch('gripTouchStart', e);
  }
</script>

<li
  data-habit-id={habit.id}
  role="listitem"
  class="group relative transition-[opacity,transform] duration-200 animate-fade-slide-up
    {dragId && dragId !== habit.id ? 'opacity-50 scale-[0.97]' : ''}
    {dragId === habit.id ? 'ring-2 ring-accent/40 rounded-2xl' : ''}
    {dropTransformClass}"
  style:animation-delay="{Math.min(appearanceIndex, 12) * 0.05}s"
  draggable={isDragActive}
  ondragstart={isDragActive ? handleDragStart : undefined}
  ondragover={isDragActive ? handleDragOver : undefined}
  ondragleave={isDragActive ? handleDragLeave : undefined}
  ondrop={isDragActive ? handleDrop : undefined}
  ondragend={isDragActive ? handleDragEnd : undefined}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchCancel}
>
  {#if showDropAbove}
    <div class="absolute -top-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
  {/if}
  {#if showDropBelow}
    <div class="absolute -bottom-1 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-progress-glow z-10 pointer-events-none"></div>
  {/if}

  <div
    class="habit-card-inner flex items-center rounded-[1.5rem] border bg-bg-card px-4 py-3 transition-[border-color,transform] duration-150 overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.06)]
      {isDragOver ? 'border-accent/50' : 'border-border hover:border-border-hover'}
      {isFrozen ? 'opacity-75' : ''}"
    style:transform={isSwipeRow ? `translateX(${swipeOffset}px)` : 'translateX(0px)'}
    style:transition={isSwipeRow && isSwipingGesture ? 'none' : 'transform 0.2s ease-out'}
    style:touch-action="pan-y"
    style:will-change="transform"
    style:width="100%"
  >
    <span class="absolute inset-y-0 left-0 w-1 rounded-l-2xl pointer-events-none" style:background={accent.hex}></span>
    <span
      class="habit-card-swipe-indicator"
      style:opacity={indicatorOpacity}
      style:background-color={indicatorColor}
    ></span>

    <div class="relative z-10 flex w-full items-center gap-3">
      {#if isDragActive}
        <button
          type="button"
          class="flex h-11 w-11 flex-shrink-0 cursor-grab items-center justify-center rounded-xl text-border/60 transition-colors hover:text-muted active:cursor-grabbing touch-none"
          aria-label="Reorder {habitLabel}"
          onclick={(e) => { e.stopPropagation(); }}
          ontouchstart={handleGripTouchStart}
        >
          <GripVertical size={14} />
        </button>
      {/if}

      <!-- Toggle button with particle burst -->
      <div class="relative flex-shrink-0">
        {#if isAnimating}
          {#each animParticles as p (p.id)}
            <span
              class="completion-burst-particle"
              style="--tx: {p.tx}px; --ty: {p.ty}px; --particle-size: {p.size}px; --particle-rotate: {p.rotation}deg; --particle-delay: {p.delay}ms; --particle-duration: {p.duration}ms; --particle-color: {p.color}; background: {p.color}; border-radius: {p.radius}; left: 50%; top: 50%; margin-left: calc({p.size}px / -2); margin-top: calc({p.size}px / -2);"
            ></span>
          {/each}
          <span class="completion-status-pop" style="color: {accent.hex}">{animLabel}</span>
        {/if}
        <HabitCompletionControl
          label={isFrozen ? `${habitLabel} is frozen today` : completionLabel}
          completed={completed}
          target={tgt}
          count={todayCount}
          accent={accent.hex}
          scheduled={isScheduled}
          frozen={isFrozen}
          {pending}
          {error}
          onToggle={handleToggle}
        />
      </div>

      <!-- Habit info (clickable) -->
      <button
        type="button"
        class="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
        onclick={handleDetail}
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1 overflow-hidden">
            <p class="min-w-0 truncate text-sm font-semibold text-foreground {completed ? 'opacity-60 line-through' : ''}">{habitLabel}</p>
            {#if tgt > 1}
              <span class="flex-shrink-0 rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">×{tgt}</span>
            {/if}
            {#if inlineTags.length > 0}
              <div class="hidden sm:flex items-center gap-1 flex-shrink-0">
                {#each inlineTags as tag, ti (tag + '-' + ti)}
                  <span class="whitespace-nowrap rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">#{tag}</span>
                {/each}
                {#if extraTagCount > 0}
                  <span class="rounded bg-accent/10 px-1 py-0.5 text-[10px] font-mono text-accent-secondary">+{extraTagCount}</span>
                {/if}
              </div>
            {/if}
          </div>

          {#if isFrozen}
            <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
              <SnowflakeIcon size={8} /> Frozen
            </span>
          {:else if !isScheduled}
            <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted">
              <Moon size={8} /> Not today
            </span>
          {/if}

          {#if hint}
            {@const hc = hint.type === 'good' ? 'text-accent' : hint.type === 'warn' ? 'text-accent-secondary' : 'text-muted'}
            <p class="mt-0.5 truncate text-[10px] font-mono {hc}">{hint.text}</p>
          {/if}
        </div>

        <!-- Right metrics -->
        <div class="flex flex-shrink-0 items-center gap-2">
          {#if momentum.kind === 'flame'}
            <span class="flex items-center gap-0.5 text-[10px] font-mono text-accent-secondary">
              <Flame size={10} aria-hidden="true" />
              <span aria-label={momentum.label}>{momentum.streak}</span>
            </span>
          {:else if momentum.kind === 'ice'}
            <span class="flex items-center gap-0.5 text-[10px] font-mono text-sky-500" aria-label={momentum.label}>
              <SnowflakeIcon size={10} aria-hidden="true" />
              {momentum.inactiveScheduledDays}d
            </span>
          {/if}
          <CompletionRing percentage={completionRate} size={26} strokeWidth={2.5} color={habit.color} showText={false} />
          <div class="hidden sm:flex items-end gap-[2px] h-4">
            {#each last7 as done, lj ('' + lj)}
              <div
                class="w-[3px] rounded-sm transition-[height,background-color,opacity]"
                style="height: {done ? '100%' : '30%'}; background-color: {done ? accent.hex : 'var(--border)'}; opacity: {0.4 + lj * 0.09}"
              ></div>
            {/each}
          </div>
          <div class="hidden md:block">
            <MiniHeatmap completions={habit.completions} dailyTarget={habit.dailyTarget} color={habit.color} />
          </div>
        </div>
      </button>

      {#if habit.description}
        <span class="flex-shrink-0"><DescriptionTooltip description={habit.description} triggerClassName="h-11 w-11" /></span>
      {/if}
    </div>
  </div>
</li>

<script context="module">
  import { Flame, GripVertical, SnowflakeIcon, Moon } from 'lucide-svelte';
</script>
