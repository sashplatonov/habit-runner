<script lang="ts">
  import { Snowflake, Flame } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import ToggleButton from './ToggleButton.svelte';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { calculateScheduledCompletionRate, calculateScheduledStreak, getScheduleStatusForDate, isMandatoryToday } from '$lib/habits/schedule';
  import { formatDate } from '$lib/habits/habitStats';
  import { computeTileHint } from '$lib/dashboard/tileHints';
  import { getAutomatismLevel, getAutomatismMessage, getAutomatismColor } from '$lib/habits/automatism';
  import type { Habit } from '$lib/types/habit';

  let {
    habit,
    onToggle,
    onDetail,
    allCheckins,
    appearanceIndex = 0
  }: {
    habit: Habit;
    onToggle: () => void;
    onDetail: () => void;
    allCheckins: Record<string, number>;
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

  const hint = $derived(computeTileHint(habit, streak, completionRate, isFrozen));
  const automatismScore = $derived(habit.automatismScore ?? 0);
  const automatismLevel = $derived(getAutomatismLevel(automatismScore));
  const automatismMessage = $derived(getAutomatismMessage(automatismLevel));
  const automatismColor = $derived(getAutomatismColor(automatismLevel));

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

  const animationDelayValue = $derived(Math.min(Math.max(appearanceIndex, 0), 12) * 0.05);
</script>

<div
  class="group relative animate-fade-slide-up cursor-pointer rounded-2xl border transition-all hover:shadow-md {completed ? 'bg-bg-card border-border/50' : 'bg-bg-secondary border-border hover:border-border-hover'}"
  style="animation-delay: {animationDelayValue}s"
  onclick={onDetail}
  role="listitem"
  tabindex={0}
  onkeydown={(e) => { if (e.key === 'Enter') onDetail(); else if (e.key === ' ') { e.preventDefault(); onToggle(); }}}
>
  <!-- Gradient bar -->
  <div class="absolute top-0 left-6 right-6 h-[2px] rounded-b-full" style="background: linear-gradient(90deg, {accent.hex}, {accent.glow})" aria-hidden="true"></div>

  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background: {accent.dim}" aria-hidden="true">
          {habit.icon}
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold truncate {completed ? 'text-muted line-through' : 'text-foreground'}">
            {habit.name}
          </h3>
          <div class="flex items-center gap-2 mt-0.5">
            {#if isFrozen}
              <span class="text-[10px] font-mono uppercase tracking-wide text-accent-secondary flex items-center gap-1">
                <Snowflake size={10} /> Frozen
              </span>
            {/if}
            {#if streak > 0}
              <span class="text-[10px] font-mono text-accent-secondary flex items-center gap-0.5">
                <Flame size={10} /> {streak}d
              </span>
            {/if}
          </div>
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
        sizeClass="w-10 h-10"
      />
    </div>

    <!-- Progress ring and rate -->
    <div class="flex items-center gap-3 mb-3">
      <CompletionRing percentage={completionRate} size={40} strokeWidth={3.5} color={habit.color} />
      <div class="flex-1">
        <div class="text-xs font-mono text-muted mb-1">{Math.round(completionRate)}% completion</div>
        <div class="h-1 bg-border rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="width: {completionRate}%; background: {accent.hex}"></div>
        </div>
      </div>
    </div>

    <!-- Automatism bar -->
    {#if automatismScore > 0}
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-mono text-muted uppercase tracking-wide">Automatism</span>
          <span class="text-[10px] font-mono" style="color: {automatismColor}">{automatismMessage}</span>
        </div>
        <div class="h-1 bg-border rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="width: {automatismScore}%; background: {automatismColor}"></div>
        </div>
      </div>
    {/if}

    <!-- Hint -->
    {#if hint}
      <div class="text-[11px] font-mono text-muted flex items-center gap-1.5 mt-1">
        <!-- Render icon inline -->
        <span class="flex-shrink-0" aria-hidden="true">💡</span>
        <span class="truncate">{hint.text}</span>
      </div>
    {/if}

    <!-- Tags -->
    {#if habit.tags.length > 0}
      <div class="flex flex-wrap gap-1 mt-2.5">
        {#each habit.tags.slice(0, 3) as tag}
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent-secondary">#{tag}</span>
        {/each}
        {#if habit.tags.length > 3}
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent-secondary">+{habit.tags.length - 3}</span>
        {/if}
      </div>
    {/if}
  </div>
</div>
