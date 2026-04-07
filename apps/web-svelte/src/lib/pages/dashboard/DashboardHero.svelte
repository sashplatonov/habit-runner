<script lang="ts">
  import { Flame, ChevronDown, ChevronUp, MoreHorizontal, TrendingUp, Zap } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';

  let {
    dateStr,
    todayRate,
    completedToday,
    totalActive,
    overallStreak,
    daysSinceLastCompletion,
    onExport,
    heroCollapsed = $bindable(false)
  }: {
    dateStr: string;
    todayRate: number;
    completedToday: number;
    totalActive: number;
    overallStreak: number;
    daysSinceLastCompletion: number;
    onExport: () => void;
    heroCollapsed: boolean;
  } = $props();

  let menuOpen = $state(false);
  let menuEl: HTMLDivElement | undefined = $state();

  const remaining = $derived(totalActive - completedToday);
  const motivationText = $derived.by(() => {
    if (todayRate >= 100) return null;
    if (todayRate >= 50) return `Almost there - ${remaining} left!`;
    if (todayRate > 0) return `Keep going - ${remaining} to go`;
    return 'Start your streak';
  });
  const showComebackBanner = $derived(daysSinceLastCompletion >= 2 && todayRate < 100);

  $effect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (menuEl && !menuEl.contains(event.target as Node)) menuOpen = false;
    };
    document.addEventListener('pointerdown', handleClickAway);
    return () => document.removeEventListener('pointerdown', handleClickAway);
  });
</script>

<section class="border-b border-border bg-bg-primary">
  <div class="px-4 py-3" style="padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem)">
    <div class="max-w-2xl mx-auto flex items-center justify-between">
      <!-- Summary bar -->
      <div>
        <div class="mb-1 flex items-center gap-2">
          <p class="text-[11px] font-mono text-muted uppercase tracking-widest">{dateStr}</p>
          <ChartGuideTooltip
            title="Today snapshot"
            summary="This dashboard summary gives you the fastest read on today: how many habits are scheduled, how much is already done, and whether your streak is still alive."
            focusPoints={['Completion ring: today progress across habits due now.', 'Done count: how many scheduled habits are already closed.', 'Streak badge: whether daily consistency is still compounding.']}
            variant="bars"
            triggerClassName="h-7 w-7"
          />
        </div>
        <div class="flex items-center gap-3">
          <CompletionRing size={28} strokeWidth={3.5} percentage={todayRate} />
          <div class="text-[12px] font-semibold text-foreground">{completedToday}/{totalActive || 0}</div>
          <div class="flex items-center gap-1 text-[12px] font-mono text-accent-secondary">
            <Flame size={14} />
            <span>{overallStreak}d</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <div class="relative" bind:this={menuEl}>
          <button
            type="button"
            onclick={() => menuOpen = !menuOpen}
            class="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} />
          </button>
          {#if menuOpen}
            <div class="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-border bg-bg-card shadow-xl z-20">
              <button
                type="button"
                onclick={() => { onExport(); menuOpen = false; }}
                class="w-full px-3 py-2 text-left text-xs font-semibold tracking-widest uppercase text-foreground hover:bg-bg-secondary"
              >
                Export CSV
              </button>
            </div>
          {/if}
        </div>
        <button
          type="button"
          onclick={() => heroCollapsed = !heroCollapsed}
          class="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center transition hover:border-accent"
          aria-label={heroCollapsed ? 'Expand hero' : 'Collapse hero'}
        >
          {#if heroCollapsed}
            <ChevronDown size={16} />
          {:else}
            <ChevronUp size={16} />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Expanded panel -->
  <div
    class="overflow-hidden transition-all duration-300"
    style="max-height: {heroCollapsed ? 0 : 1200}px"
    aria-hidden={heroCollapsed}
  >
    <div class="px-4 pb-4">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-5 mb-3">
          <CompletionRing size={88} strokeWidth={7} percentage={todayRate} />
          <div class="flex-1 flex flex-col gap-2">
            {#if motivationText}
              <p class="text-xs font-mono {todayRate >= 50 ? 'text-accent-secondary' : 'text-muted'} tracking-wide">
                {motivationText}
              </p>
            {/if}
            <!-- Stat cards -->
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-bg-card border border-border rounded-xl px-3 py-2">
                <div class="flex items-center gap-1.5 mb-1">
                  <Zap size={10} class="text-accent" />
                  <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Active</span>
                </div>
                <span class="text-lg font-mono font-bold text-foreground">{totalActive}</span>
              </div>
              <div class="bg-bg-card border border-border rounded-xl px-3 py-2">
                <div class="flex items-center gap-1.5 mb-1">
                  <Flame size={10} class="text-accent-secondary" />
                  <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Streak</span>
                </div>
                <span class="text-lg font-mono font-bold text-accent-secondary">{overallStreak}d</span>
              </div>
              <div class="bg-bg-card border border-border rounded-xl px-3 py-2">
                <div class="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={10} class="text-accent-secondary" />
                  <span class="text-[10px] font-mono text-muted uppercase tracking-wider">Done</span>
                </div>
                <span class="text-lg font-mono font-bold text-accent-secondary">{completedToday}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="h-[3px] bg-border rounded-full overflow-hidden mb-3">
          <div
            class="h-full rounded-full transition-all duration-700 {todayRate >= 100 ? 'animate-progress-glow' : ''}"
            style="width: {Math.min(todayRate, 100)}%; background: {todayRate >= 100 ? 'linear-gradient(90deg, var(--accent-secondary), var(--accent))' : 'linear-gradient(90deg, var(--accent), var(--accent-secondary))'}; box-shadow: 0 0 8px var(--glow)"
          ></div>
        </div>

        <!-- Banners -->
        {#if showComebackBanner}
          <div class="animate-comeback-slide mb-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 flex items-center gap-3">
            <span class="text-lg" role="img" aria-label="welcome back">👋</span>
            <div>
              <p class="text-sm font-semibold text-foreground">Welcome back!</p>
              <p class="text-[11px] font-mono text-muted">You've been away for {daysSinceLastCompletion} days. Let's start fresh today!</p>
            </div>
          </div>
        {/if}
        {#if todayRate >= 100}
          <div class="animate-slide-down-fade mb-3 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-2.5 flex items-center gap-3">
            <span class="text-lg" role="img" aria-label="celebration">🎉</span>
            <div>
              <p class="text-sm font-semibold text-foreground">Perfect day!</p>
              <p class="text-[11px] font-mono text-muted">All habits completed. Keep the streak alive!</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
