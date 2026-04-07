<script lang="ts">
  import { GripVertical, Snowflake, Flame, Trophy, Moon } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import ToggleButton from './ToggleButton.svelte';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday } from '$lib/habits/schedule';
  import { formatDate } from '$lib/habits/habitStats';
  import { swipeGesture } from '$lib/actions/swipeGesture';
  import type { Habit } from '$lib/types/habit';

  type DropHintPosition = 'above' | 'below' | null;

  let {
    habit,
    onToggle,
    onDetail,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    isDropTarget = false,
    isDragging = false,
    dropHintPosition = null,
    appearanceIndex = 0
  }: {
    habit: Habit;
    onToggle: () => void;
    onDetail: () => void;
    onDragStart?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
    onDragEnd?: () => void;
    onTouchStart?: (event: TouchEvent) => void;
    isDropTarget?: boolean;
    isDragging?: boolean;
    dropHintPosition?: DropHintPosition;
    appearanceIndex?: number;
  } = $props();

  const todayKey = formatDate(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const status = $derived(getScheduleStatusForDate(habit, todayDate));
  const scheduledToday = $derived(status === 'scheduled' && isMandatoryToday(habit, todayDate));
  const target = $derived(Math.max(1, habit.dailyTarget ?? 1));
  const todayCount = $derived(habit.completions[todayKey] ?? 0);
  const completed = $derived(todayCount >= target);
  const accent = $derived(HABIT_COLOR_THEMES[habit.color]);
  const streakData = $derived(calculateScheduledStreak(habit, habit.completions));
  const streak = $derived(streakData.current);
  const completionRate = $derived(calculateScheduledCompletionRate(habit, habit.completions));
  const isFrozen = $derived(status === 'frozen');

  const last7 = $derived.by(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - (6 - i));
      return (habit.completions[formatDate(cursor)] ?? 0) >= target;
    });
  });

  const toggleButtonClass = $derived.by(() => {
    if (completed) return `${accent.bgClass} ${accent.borderClass}`;
    if (scheduledToday) return 'border-border-hover hover:border-muted';
    if (isFrozen) return 'border-border bg-bg-secondary text-muted';
    return 'border border-dashed border-border/40 text-muted hover:border-border';
  });

  const toggleButtonTitle = $derived.by(() => {
    if (scheduledToday) return `Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`;
    if (isFrozen) return 'Frozen today';
    return `Manual completion for ${habit.name}`;
  });

  let swipeOffset = $state(0);
  let swipeDirection = $state<'left' | 'right' | null>(null);
  let isSwiping = $state(false);

  const dropTransformClass = $derived(
    dropHintPosition === 'above' ? '-translate-y-2' : dropHintPosition === 'below' ? 'translate-y-2' : ''
  );
  const dragTransformClass = $derived(isDragging ? 'opacity-50 scale-[0.97] shadow-2xl ring-2 ring-accent/40' : '');
  const animationDelayValue = $derived(Math.min(Math.max(appearanceIndex, 0), 12) * 0.05);
  const indicatorOpacity = $derived(Math.min(1, Math.abs(swipeOffset) / 120));
  const indicatorColor = $derived(
    swipeDirection === 'right' ? 'rgba(16,185,129,0.25)' : swipeDirection === 'left' ? 'rgba(59,130,246,0.25)' : 'transparent'
  );

  const inlineTags = $derived(habit.tags.slice(0, 3));
  const extraTagCount = $derived(Math.max(0, habit.tags.length - inlineTags.length));
  const statusBadge = $derived.by(() => {
    if (isFrozen) return { label: 'Frozen', tone: 'text-accent-secondary', title: 'Frozen today' };
    if (!scheduledToday) return { label: 'Not today', tone: 'text-muted', title: 'Not scheduled today' };
    return null;
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); onDetail(); }
    else if (e.key === ' ') { e.preventDefault(); onToggle(); }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  data-habit-id={habit.id}
  draggable={Boolean(onDragStart)}
  ondragstart={onDragStart}
  ondragover={onDragOver}
  ondrop={onDrop}
  ondragend={onDragEnd}
  tabindex={0}
  role="listitem"
  aria-label="{habit.name}, {completed ? 'completed' : 'not completed'}"
  onkeydown={handleKeyDown}
  class="relative flex items-stretch w-full transform px-2 py-1.5 {dropTransformClass} {dragTransformClass}"
>
  <div
    class="habit-card-inner group z-0 flex items-stretch border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer {isDropTarget ? 'border-accent/60 bg-accent/5' : ''} {isFrozen ? 'bg-bg-card opacity-80 border-border/50' : 'bg-bg-secondary border-border hover:border-border-hover'} animate-fade-slide-up active:scale-[0.98] active:shadow-sm"
    style="animation-delay: {animationDelayValue}s; transform: translateX({swipeOffset}px); transition: {isSwiping ? 'none' : 'transform 0.2s ease-out'}; touch-action: pan-y; will-change: transform; width: 100%"
    onclick={onDetail}
    use:swipeGesture={{
      threshold: 60,
      onSwipeLeft: onDetail,
      onSwipeRight: () => { if (!isFrozen) onToggle(); },
      onMove: (offset, dir) => { swipeOffset = offset; swipeDirection = dir; isSwiping = true; },
      onEnd: () => { swipeOffset = 0; swipeDirection = null; isSwiping = false; }
    }}
  >
    <span
      class="habit-card-swipe-indicator"
      style="opacity: {indicatorOpacity}; background-color: {indicatorColor}"
    ></span>

    <!-- Content -->
    <div class="relative z-10 flex items-center min-w-0 overflow-hidden flex-1">
      <div class="w-1 self-stretch flex-shrink-0 rounded-l-xl" style="background: {accent.hex}" aria-hidden="true"></div>
      <div class="flex-1 flex items-center justify-between w-full px-2 py-2">
        <div class="flex items-center min-w-0 gap-2">
          <!-- Grip handle -->
          <div
            class="flex items-center p-0.5 -mx-0.5 touch-none cursor-grab active:cursor-grabbing"
            ontouchstart={onTouchStart}
            aria-hidden="true"
          >
            <GripVertical size={14} class="text-muted/60 group-hover:text-muted transition-colors" />
          </div>

          <!-- Icon -->
          <div
            class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style="background: {accent.dim}"
            aria-hidden="true"
          >
            {habit.icon}
          </div>

          <!-- Name + tags + status -->
          <div class="flex flex-col min-w-0 text-left overflow-hidden justify-center">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-sm font-semibold {completed ? 'text-muted line-through' : 'text-foreground'} truncate">
                {habit.name}
              </span>
              {#if habit.description}
                <DescriptionTooltip description={habit.description} />
              {/if}
              {#if habit.dailyTarget && habit.dailyTarget > 1}
                <span class="flex-shrink-0 text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">
                  ×{habit.dailyTarget}
                </span>
              {/if}
              {#if inlineTags.length > 0}
                <div class="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {#each inlineTags as tag}
                    <span class="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary whitespace-nowrap">#{tag}</span>
                  {/each}
                  {#if extraTagCount > 0}
                    <span class="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent-secondary">+{extraTagCount}</span>
                  {/if}
                </div>
              {/if}
            </div>
            {#if statusBadge}
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="flex items-center gap-1 flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.3em] {statusBadge.tone}"
                  aria-label={statusBadge.title}
                >
                  {#if isFrozen}<Snowflake size={10} class="text-current" />{/if}
                  {statusBadge.label}
                </span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Right metrics -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <ChartGuideTooltip
            title="{habit.name} row"
            summary="This row condenses one habit into a fast scan: current status, short-term history, completion rate, and a direct action button."
            focusPoints={['Status and tags: see whether the habit is due, frozen, or off-schedule today.', 'Right-side metrics: streak, rate ring, and recent bars reveal momentum.', 'Toggle button: update today without leaving the dashboard.']}
            variant="columns"
            triggerClassName="hidden sm:inline-flex h-7 w-7"
          />

          <!-- Metrics -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <div class="flex items-center gap-0.5 w-10 sm:w-20 justify-end">
              {#if streak > 0}
                {#if habit.type === 'negative'}
                  <span class="hidden sm:inline flex items-center gap-0.5 text-[10px] font-mono text-accent-secondary whitespace-nowrap">
                    <Trophy size={9} class="inline-block flex-shrink-0" />{streak}d
                  </span>
                {:else}
                  <Flame size={10} class="text-accent-secondary flex-shrink-0" />
                  <span class="text-[10px] font-mono text-accent-secondary">{streak}</span>
                {/if}
              {/if}
            </div>

            <CompletionRing percentage={completionRate} size={28} strokeWidth={2.5} color={habit.color} showText={false} />

            <div class="hidden sm:flex items-end gap-[1px] h-4 ml-0.5" aria-hidden="true">
              {#each last7 as done, i}
                <div
                  class="w-[4px] rounded-sm transition-all"
                  style="height: {done ? '100%' : '30%'}; background-color: {done ? accent.hex : 'var(--border)'}; opacity: {i === 6 ? 1 : 0.5 + i * 0.07}"
                ></div>
              {/each}
            </div>

            <div class="hidden lg:flex items-center justify-end ml-1" aria-hidden="true">
              <MiniHeatmap completions={habit.completions} dailyTarget={target} color={habit.color} />
            </div>
          </div>

          <ToggleButton
            {completed}
            {isFrozen}
            {accent}
            {toggleButtonClass}
            {toggleButtonTitle}
            {onToggle}
            {streak}
            todayCount={todayCount}
            dailyTarget={target}
          />
        </div>
      </div>
    </div>
  </div>
</div>
