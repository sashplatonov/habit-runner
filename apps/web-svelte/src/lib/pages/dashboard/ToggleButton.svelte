<script lang="ts">
  import { Check, Snowflake } from 'lucide-svelte';
  import confetti from 'canvas-confetti';
  import { isPhaseTransition } from '$lib/habits/phases';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  let {
    completed,
    isFrozen,
    accent,
    toggleButtonClass,
    toggleButtonTitle,
    onToggle,
    streak,
    sizeClass = 'w-8 h-8',
    todayCount,
    dailyTarget
  }: {
    completed: boolean;
    isFrozen: boolean;
    accent: HabitColorTheme;
    toggleButtonClass: string;
    toggleButtonTitle: string;
    onToggle: () => void;
    streak: number;
    sizeClass?: string;
    todayCount: number;
    dailyTarget: number;
  } = $props();

  const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-secondary)', '#fff', 'var(--glow)'];

  let animating = $state(false);
  let particles = $state<Array<{ id: number; tx: number; ty: number; color: string }>>([]);
  let particleId = 0;

  const safeDailyTarget = $derived(Math.max(1, dailyTarget));
  const cappedTodayCount = $derived(Math.min(Math.max(todayCount, 0), safeDailyTarget));
  const showProgress = $derived(safeDailyTarget > 1);
  const progressRatio = $derived(cappedTodayCount / safeDailyTarget);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (!completed) {
      animating = true;
      particles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const dist = 20 + Math.random() * 18;
        return {
          id: ++particleId,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist - 10,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        };
      });

      if (isPhaseTransition(streak + 1)) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 160,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', accent.hex],
            zIndex: 1000
          });
        }, 300);
      }

      setTimeout(() => { animating = false; particles = []; }, 650);
    }
    onToggle();
  }
</script>

<div class="relative flex-shrink-0">
  {#each particles as p (p.id)}
    <span
      class="confetti-particle"
      style="--tx: {p.tx}px; --ty: {p.ty}px; background: {p.color}; left: 50%; top: 50%; margin-left: -3px; margin-top: -3px"
    ></span>
  {/each}
  <button
    type="button"
    onclick={handleClick}
    disabled={isFrozen}
    class="{sizeClass} rounded-xl border-[1.5px] flex items-center justify-center transition-all duration-200 relative {toggleButtonClass} {animating ? 'animate-check-pulse animate-glow-burst' : ''} {isFrozen ? 'cursor-not-allowed opacity-60' : ''}"
    style={completed && !isFrozen ? `box-shadow: 0 0 12px ${accent.glow}` : ''}
    aria-label={toggleButtonTitle}
    title={toggleButtonTitle}
  >
    {#if showProgress}
      <span class="absolute inset-[2px] rounded-[10px] pointer-events-none overflow-hidden" aria-hidden="true">
        <span
          class="absolute inset-y-0 left-0 rounded-[8px] transition-all duration-200"
          style="width: {progressRatio * 100}%; background: linear-gradient(90deg, {accent.hex}88, {accent.hex})"
        ></span>
      </span>
      <span class="absolute inset-[5px] flex items-end gap-[2px] pointer-events-none z-0" aria-hidden="true">
        {#each Array(safeDailyTarget) as _, index}
          <span
            class="h-full flex-1 rounded-full transition-colors duration-200"
            style="background-color: {index < cappedTodayCount ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)'}; opacity: {index < cappedTodayCount ? 1 : 0.6}"
          ></span>
        {/each}
      </span>
    {/if}
    {#if isFrozen}
      <Snowflake size={12} class="opacity-70 text-muted" />
    {:else if completed}
      <Check size={14} class="{accent.textClass} relative z-10" strokeWidth={3} />
    {/if}
  </button>
</div>
